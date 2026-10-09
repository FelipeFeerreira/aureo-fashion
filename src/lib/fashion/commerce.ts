import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { effectivePrice } from "./catalog";
import { CheckoutError } from "@/lib/checkout/schema";
export const bagSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().max(64),
        variantId: z.string().max(64),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .max(30),
  coupon: z.string().trim().toUpperCase().max(40).optional(),
});
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  street: z.string().trim().min(2).max(150),
  number: z.string().trim().min(1).max(20),
  city: z.string().trim().min(2).max(100),
  state: z
    .string()
    .regex(
      /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/,
    ),
});
export async function quoteBag(input: z.infer<typeof bagSchema>) {
  const quantities = new Map<string, number>();
  for (const i of input.items) {
    quantities.set(
      i.variantId,
      (quantities.get(i.variantId) ?? 0) + i.quantity,
    );
  }
  const variants = await db.productVariant.findMany({
    where: { id: { in: [...quantities.keys()] } },
    include: { product: true },
  });
  const lines = input.items
    .filter(
      (item, i, all) =>
        all.findIndex((x) => x.variantId === item.variantId) === i,
    )
    .map((item) => {
      const v = variants.find(
        (v) => v.id === item.variantId && v.productId === item.productId,
      );
      if (!v || !v.active || v.product.archived || !v.product.categoryId)
        throw new CheckoutError(
          "Uma variante não está mais disponível. Remova a peça da sacola.",
        );
      const quantity = quantities.get(v.id)!;
      if (quantity > v.stock || quantity > 10)
        throw new CheckoutError(
          `Estoque insuficiente para ${v.product.name}, ${v.color}, ${v.size}. Disponível: ${v.stock}.`,
        );
      return {
        productId: v.productId,
        variantId: v.id,
        name: v.product.name,
        size: v.size,
        color: v.color,
        sku: v.sku,
        quantity,
        unitPriceCents: effectivePrice(v.product),
        sample: v.product.sample,
      };
    });
  const subtotalCents = lines.reduce(
    (n, x) => n + x.quantity * x.unitPriceCents,
    0,
  );
  let discountCents = 0;
  if (input.coupon) {
    const c = await db.coupon.findUnique({ where: { code: input.coupon } });
    if (
      !c ||
      !c.active ||
      c.expiresAt < new Date() ||
      subtotalCents < c.minimumCents
    )
      throw new CheckoutError(
        "Cupom inválido, expirado ou valor mínimo não atingido.",
      );
    discountCents = Math.floor((subtotalCents * c.percent) / 100);
  }
  return {
    lines,
    subtotalCents,
    discountCents,
    shippingCents: 0,
    totalCents: subtotalCents - discountCents,
    shippingLabel: "Frete real ainda não configurado. No teste, frete R$ 0,00.",
  };
}
