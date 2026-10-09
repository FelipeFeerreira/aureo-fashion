import { randomUUID } from "node:crypto";
import { beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { quoteBag, addressSchema } from "@/lib/fashion/commerce";
import { processStripeEvent } from "@/lib/orders/fulfill";
import { POST as saveProduct } from "@/app/api/admin/products/route";
import { POST as media } from "@/app/api/admin/media/route";
import { POST as checkout } from "@/app/api/fashion/checkout/route";
import {
  POST as newsletter,
  DELETE as cancelNewsletter,
} from "@/app/api/fashion/newsletter/route";
import { createAdminSession, sessionCookie } from "@/lib/admin/auth";
import type Stripe from "stripe";
const mock = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/checkout/stripe", async (original) => ({
  ...(await original<typeof import("@/lib/checkout/stripe")>()),
  getStripe: () => ({ checkout: { sessions: { create: mock.create } } }),
}));
const productId = "fashion-test",
  variantId = "fashion-test-m";
function request(path: string, data: unknown, cookie = "") {
  return new Request(`http://localhost:3200${path}`, {
    method: "POST",
    headers: {
      origin: "http://localhost:3200",
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
async function clean() {
  await db.order.deleteMany({ where: { items: { some: { productId } } } });
  await db.product.deleteMany({ where: { id: productId } });
  await db.category.deleteMany({ where: { slug: "fashion-test" } });
  await db.coupon.deleteMany({ where: { code: "FASHION10" } });
  await db.rateLimit.deleteMany();
}
beforeEach(async () => {
  await clean();
  const c = await db.category.create({
    data: { slug: "fashion-test", name: "Camisetas" },
  });
  await db.product.create({
    data: {
      id: productId,
      slug: productId,
      name: "Camiseta teste",
      type: "ACCESSORY",
      tagline: "Teste",
      description: "Amostra",
      priceCents: 15000,
      stock: 999,
      tastingNotes: [],
      brewMethods: [],
      imageUrl: "/images/tee.jpg",
      imageAlt: "Teste",
      categoryId: c.id,
      variants: {
        create: [
          {
            id: variantId,
            sku: "TEST-M",
            size: "M",
            color: "Preto",
            colorHex: "#151515",
            stock: 2,
          },
          {
            id: "fashion-test-g",
            sku: "TEST-G",
            size: "G",
            color: "Preto",
            colorHex: "#151515",
            stock: 0,
          },
        ],
      },
    },
  });
  await db.coupon.create({
    data: {
      code: "FASHION10",
      percent: 10,
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  process.env.ADMIN_TOKEN = "a".repeat(64);
  mock.create.mockReset().mockImplementation(async (p) => ({
    id: "cs_test_" + p.metadata.orderId,
    url: "https://checkout.stripe.com/test",
    status: "open",
    livemode: false,
  }));
});
afterAll(async () => {
  await clean();
  await db.newsletterSubscriber.deleteMany({
    where: { email: "fashion-test@example.com" },
  });
  await db.$disconnect();
});
describe("fashion commerce against PostgreSQL", () => {
  it("allows consent withdrawal only with this browser's private subscription cookie", async () => {
    await db.newsletterSubscriber.deleteMany({
      where: { email: "fashion-test@example.com" },
    });
    const subscribed = await newsletter(
      request("/api/fashion/newsletter", {
        email: "fashion-test@example.com",
        consent: true,
      }),
    );
    const privateCookie = subscribed.headers.get("set-cookie")!;
    expect(privateCookie).toContain("HttpOnly");
    const duplicate = await newsletter(
      request("/api/fashion/newsletter", {
        email: "fashion-test@example.com",
        consent: true,
      }),
    );
    expect(duplicate.headers.get("set-cookie")).toBeNull();
    await cancelNewsletter(request("/api/fashion/newsletter", {}));
    expect(
      await db.newsletterSubscriber.count({
        where: { email: "fashion-test@example.com" },
      }),
    ).toBe(1);
    const canceled = await cancelNewsletter(
      request("/api/fashion/newsletter", {}, privateCookie),
    );
    expect(canceled.status).toBe(200);
    expect(
      await db.newsletterSubscriber.count({
        where: { email: "fashion-test@example.com" },
      }),
    ).toBe(0);
  });

  it("retires and reactivates a size without changing its stable variant ID", async () => {
    const product = await db.product.findUniqueOrThrow({
      where: { id: productId },
      include: { variants: true },
    });
    const cookie = sessionCookie(await createAdminSession());
    const payload = {
      ...product,
      images: [
        { url: "/images/tee.jpg", alt: "Camiseta ilustrativa", color: null },
      ],
      variants: product.variants.filter((v) => v.size === "G"),
    };
    expect(
      (await saveProduct(request("/api/admin/products", payload, cookie)))
        .status,
    ).toBe(200);
    expect(
      (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } }))
        .active,
    ).toBe(false);
    const original = product.variants.find((v) => v.id === variantId)!;
    const restored = { ...original, id: undefined };
    expect(
      (
        await saveProduct(
          request(
            "/api/admin/products",
            { ...payload, variants: [...payload.variants, restored] },
            cookie,
          ),
        )
      ).status,
    ).toBe(200);
    expect(
      (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } }))
        .active,
    ).toBe(true);
    expect(await db.productVariant.count({ where: { productId } })).toBe(2);
  });

  it("prices canonical variants, rejects missing variants and never trusts product stock", async () => {
    const q = await quoteBag({
      items: [{ productId, variantId, quantity: 1 }],
    });
    expect(q.totalCents).toBe(15000);
    await expect(
      quoteBag({ items: [{ productId, variantId: "missing", quantity: 1 }] }),
    ).rejects.toThrow();
    await expect(
      quoteBag({
        items: [{ productId, variantId: "fashion-test-g", quantity: 1 }],
      }),
    ).rejects.toThrow();
    await expect(
      quoteBag({
        items: [
          { productId, variantId, quantity: 2 },
          { productId, variantId, quantity: 1 },
        ],
      }),
    ).rejects.toThrow();
    await expect(
      quoteBag({ items: [{ productId: "forged", variantId, quantity: 1 }] }),
    ).rejects.toThrow();
  });
  it("validates coupons and scheduled discounts from database", async () => {
    await db.product.update({
      where: { id: productId },
      data: {
        salePriceCents: 12000,
        saleStartsAt: new Date(Date.now() - 1000),
        saleEndsAt: new Date(Date.now() + 60000),
      },
    });
    expect(
      (
        await quoteBag({
          items: [{ productId, variantId, quantity: 1 }],
          coupon: "FASHION10",
        })
      ).totalCents,
    ).toBe(10800);
    await db.coupon.update({
      where: { code: "FASHION10" },
      data: { expiresAt: new Date(0) },
    });
    await expect(
      quoteBag({
        items: [{ productId, variantId, quantity: 1 }],
        coupon: "FASHION10",
      }),
    ).rejects.toThrow();
  });
  it("validates Brazilian CEP and state", () => {
    const address = {
      name: "Teste",
      email: "teste@example.com",
      cep: "01310-100",
      street: "Paulista",
      number: "100",
      city: "São Paulo",
      state: "SP",
    };
    expect(addressSchema.safeParse(address).success).toBe(true);
    expect(addressSchema.safeParse({ ...address, cep: "123" }).success).toBe(
      false,
    );
    expect(addressSchema.safeParse({ ...address, state: "ZZ" }).success).toBe(
      false,
    );
  });
  it("creates only a test checkout with immutable BRL variant snapshots", async () => {
    const body = {
      items: [{ productId, variantId, quantity: 1 }],
      checkoutKey: randomUUID(),
      expectedTotalCents: 15000,
      address: {
        name: "Teste",
        email: "teste@example.com",
        cep: "01310-100",
        street: "Paulista",
        number: "100",
        city: "São Paulo",
        state: "SP",
      },
    };
    const r = await checkout(request("/api/fashion/checkout", body));
    expect(r.status).toBe(200);
    const order = await db.order.findUniqueOrThrow({
      where: { checkoutKey: body.checkoutKey },
      include: { items: true },
    });
    expect(order.status).toBe("PENDING");
    expect(order.currency).toBe("brl");
    expect(order.items[0]).toMatchObject({
      variantId,
      size: "M",
      color: "Preto",
      sku: "TEST-M",
      unitPriceCents: 15000,
    });
    expect(mock.create.mock.calls[0][0]).toMatchObject({
      locale: "pt-BR",
      payment_method_types: ["card"],
      shipping_address_collection: { allowed_countries: ["BR"] },
    });
    const forged = await checkout(
      request("/api/fashion/checkout", {
        ...body,
        checkoutKey: randomUUID(),
        expectedTotalCents: 1,
      }),
    );
    expect(forged.status).toBe(409);
  });
  it("serializes competing paid orders and duplicate events without negative variant stock", async () => {
    await db.productVariant.update({
      where: { id: variantId },
      data: { stock: 1 },
    });
    async function order() {
      return db.order.create({
        data: {
          number:
            "EO-" + randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
          checkoutKey: randomUUID(),
          requestHash: "fixture",
          checkoutOrigin: "http://localhost:3200",
          currency: "brl",
          subtotalCents: 15000,
          shippingCents: 0,
          totalCents: 15000,
          items: {
            create: {
              productId,
              variantId,
              name: "Camiseta teste",
              size: "M",
              color: "Preto",
              sku: "TEST-M",
              quantity: 1,
              unitPriceCents: 15000,
            },
          },
        },
      });
    }
    const orders = await Promise.all([order(), order()]);
    function event(o: (typeof orders)[0]): Stripe.Event {
      return {
        id: "evt_" + o.id,
        type: "checkout.session.completed",
        livemode: false,
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "cs_test_" + o.id,
            metadata: { orderId: o.id },
            client_reference_id: o.id,
            mode: "payment",
            payment_status: "paid",
            amount_total: 15000,
            currency: "brl",
            livemode: false,
            customer_details: { email: "teste@example.com" },
          },
        },
      } as unknown as Stripe.Event;
    }
    await Promise.all(orders.map((o) => processStripeEvent(event(o))));
    await processStripeEvent(event(orders[0]));
    const results = await db.order.findMany({
      where: { id: { in: orders.map((o) => o.id) } },
    });
    expect(results.map((o) => o.status).sort()).toEqual([
      "PAID",
      "PAYMENT_REVIEW",
    ]);
    expect(
      (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } }))
        .stock,
    ).toBe(0);
    expect(
      (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock,
    ).toBe(999);
  });
  it("protects product editing and media uploads before reading payloads", async () => {
    expect((await saveProduct(request("/api/admin/products", {}))).status).toBe(
      401,
    );
    expect((await media(request("/api/admin/media", {}))).status).toBe(401);
    const cookie = sessionCookie(await createAdminSession());
    expect((await media(request("/api/admin/media", {}, cookie))).status).toBe(
      503,
    );
  });
  it("requires explicit newsletter consent and persists consent version", async () => {
    expect(
      (
        await newsletter(
          request("/api/fashion/newsletter", {
            email: "fashion-test@example.com",
            consent: false,
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await newsletter(
          request("/api/fashion/newsletter", {
            email: "fashion-test@example.com",
            consent: true,
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      await db.newsletterSubscriber.findUnique({
        where: { email: "fashion-test@example.com" },
      }),
    ).toMatchObject({ consentVersion: "newsletter-v1" });
  });
});
