import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { paymentAdapter } from "@/lib/fashion/payments";
import { db } from "@/lib/db";
import { bagSchema, addressSchema, quoteBag } from "@/lib/fashion/commerce";
import { siteOrigin } from "@/lib/checkout/stripe";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
const schema = bagSchema.extend({
  checkoutKey: z.uuid(),
  expectedTotalCents: z.number().int().positive(),
  address: addressSchema,
});
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    if (!paymentAdapter.configured())
      return privateJson(
        {
          error:
            "Checkout de teste indisponível. Configure as credenciais de teste e o webhook. Sua sacola está salva.",
        },
        503,
      );
    if (!(await consumeLimit(requestLimitKey(req, "fashion-checkout"), 15)))
      return privateJson(
        { error: "Muitas tentativas. Aguarde 15 minutos." },
        429,
      );
    const input = schema.parse(JSON.parse(await readBody(req))),
      quote = await quoteBag(input);
    if (!quote.lines.length || quote.totalCents !== input.expectedTotalCents)
      throw new CheckoutError("O preço mudou. Atualize a sacola.");
    const requestHash = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    // Coupon discount is allocated over units so immutable item totals equal the provider total.
    const totalUnits = quote.lines.reduce((n, l) => n + l.quantity, 0);
    let discountLeft = quote.discountCents,
      unitsLeft = totalUnits;
    const snapshots = quote.lines.flatMap((l) =>
      Array.from({ length: l.quantity }, () => {
        const discount = Math.min(
          l.unitPriceCents,
          Math.floor(discountLeft / unitsLeft),
        );
        discountLeft -= discount;
        unitsLeft--;
        return {
          productId: l.productId,
          variantId: l.variantId,
          name: l.name,
          size: l.size,
          color: l.color,
          sku: l.sku,
          quantity: 1,
          unitPriceCents: l.unitPriceCents - discount,
        };
      }),
    );
    // Allocate remaining cents without ever producing a negative unit price.
    for (const l of snapshots) {
      const d = Math.min(l.unitPriceCents, discountLeft);
      l.unitPriceCents -= d;
      discountLeft -= d;
    }
    const grouped = new Map<string, (typeof snapshots)[number]>();
    for (const line of snapshots) {
      const key = `${line.variantId}:${line.unitPriceCents}`;
      const existing = grouped.get(key);
      if (existing) existing.quantity += line.quantity;
      else grouped.set(key, { ...line });
    }
    const order = await db.order.upsert({
      where: { checkoutKey: input.checkoutKey },
      update: {},
      create: {
        number: `EO-${randomBytes(8).toString("hex").toUpperCase()}`,
        checkoutKey: input.checkoutKey,
        requestHash,
        status: "PENDING",
        currency: "brl",
        email: input.address.email.toLowerCase(),
        customerName: input.address.name,
        shippingAddress: input.address,
        checkoutOrigin: siteOrigin(),
        subtotalCents: quote.totalCents,
        shippingCents: 0,
        totalCents: quote.totalCents,
        items: { create: [...grouped.values()] },
      },
      include: { items: true },
    });
    if (
      order.requestHash !== requestHash ||
      order.status !== "PENDING" ||
      Date.now() - order.createdAt.getTime() > 25 * 60 * 1000
    )
      throw new CheckoutError(
        "Tentativa encerrada ou alterada. Recarregue a sacola.",
      );
    const session = await paymentAdapter.start(order);
    if (session.live || !session.open || !session.url)
      throw new CheckoutError("Sessão de teste indisponível.");
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });
    return privateJson({ url: session.url, sessionId: session.id });
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError
            ? e.message
            : "Não foi possível abrir o checkout de teste. Confira os dados e tente novamente.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
