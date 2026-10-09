import "server-only";
import { z } from "zod";
import { adminCookieValue, getAdminSession } from "@/lib/admin/auth";
import { requireSameOrigin } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
export async function requireOwner(req: Request) {
  requireSameOrigin(req);
  if (!(await getAdminSession(adminCookieValue(req))))
    throw new CheckoutError("Acesso restrito à marca.", 401);
}
export const mediaUrl = z
  .string()
  .max(1000)
  .refine(
    (x) =>
      /^\/images\/[a-zA-Z0-9_-]+\.(jpg|webp|png)$/.test(x) ||
      x.startsWith(
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`,
      ),
    "Use uma imagem enviada para a biblioteca.",
  );
export const productEdit = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2).max(150),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(150),
    tagline: z.string().max(200),
    description: z.string().max(5000),
    categoryId: z.string(),
    collection: z.string().max(100),
    composition: z.string().max(1000),
    fit: z.string().max(1000),
    care: z.string().max(1000),
    priceCents: z.number().int().min(1).max(10000000),
    salePriceCents: z.number().int().min(1).max(10000000).nullable(),
    saleStartsAt: z.iso.datetime().nullable(),
    saleEndsAt: z.iso.datetime().nullable(),
    featured: z.boolean(),
    archived: z.boolean(),
    sample: z.boolean(),
    tags: z.array(z.string().max(50)).max(20),
    sizeChart: z
      .array(
        z.object({
          size: z.string().max(20),
          chest: z.number().positive(),
          length: z.number().positive(),
        }),
      )
      .max(20),
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          sku: z.string().min(1).max(100),
          size: z.string().min(1).max(20),
          color: z.string().min(1).max(40),
          colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          stock: z.number().int().min(0).max(100000),
          active: z.boolean().default(true),
        }),
      )
      .min(1)
      .max(200),
    images: z
      .array(
        z.object({
          url: mediaUrl,
          alt: z.string().min(1).max(250),
          color: z.string().max(40).nullable(),
          storageKey: z.string().max(250).nullable().optional(),
        }),
      )
      .max(20),
  })
  .refine((p) => !p.salePriceCents || p.salePriceCents < p.priceCents, {
    message: "O preço promocional deve ser menor que o preço normal.",
  })
  .refine((p) => p.archived || p.images.length > 0, {
    message: "Publique ao menos uma imagem.",
  })
  .refine(
    (p) => !p.saleStartsAt || !p.saleEndsAt || p.saleEndsAt > p.saleStartsAt,
    { message: "A promoção deve terminar depois do início." },
  )
  .refine(
    (p) =>
      new Set(p.variants.map((v) => `${v.color}:${v.size}`)).size ===
      p.variants.length,
    { message: "Há variantes repetidas." },
  );
