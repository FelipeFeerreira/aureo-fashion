import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
export const fashionInclude = {
  category: true,
  variants: {
    where: { active: true },
    orderBy: [{ color: "asc" as const }, { size: "asc" as const }],
  },
  images: { orderBy: { position: "asc" as const } },
};
export type FashionProduct = Prisma.ProductGetPayload<{
  include: typeof fashionInclude;
}>;
export function effectivePrice(
  p: {
    priceCents: number;
    salePriceCents: number | null;
    saleStartsAt: Date | null;
    saleEndsAt: Date | null;
  },
  now = new Date(),
) {
  return p.salePriceCents !== null &&
    (!p.saleStartsAt || p.saleStartsAt <= now) &&
    (!p.saleEndsAt || p.saleEndsAt > now)
    ? p.salePriceCents
    : p.priceCents;
}
export async function settings() {
  return (
    (await db.storeSettings.findUnique({ where: { id: "store" } })) ?? {
      name: "AUREO",
      slogan: "O essencial tem presença.",
      announcement: "Coleção 01 — Uma nova forma de vestir o cotidiano",
      heroTitle: "Menos excesso. Mais essência.",
      heroImage: "/images/editorial.jpg",
      accent: "#151515",
      privacyDraft: "Rascunho em revisão.",
      returnsDraft: "Rascunho em revisão.",
      shippingDraft: "Rascunho em revisão.",
      termsDraft: "Rascunho em revisão.",
    }
  );
}
export async function categories() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" } });
}
export async function catalog(
  params: Record<string, string | string[] | undefined> = {},
) {
  const value = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : "";

  const q = value("q").slice(0, 80),
    size = value("size"),
    color = value("color");
  const number = (key: string, fallback: number) => {
    const n = Number(value(key));
    return value(key) && Number.isFinite(n) ? Math.max(0, n) : fallback;
  };
  const min = number("min", 0) * 100,
    max = number("max", 100000) * 100;
  const page = Math.max(1, Math.min(1000, Math.floor(number("page", 1))));
  const price = Prisma.sql`CASE WHEN p."salePriceCents" IS NOT NULL AND (p."saleStartsAt" IS NULL OR p."saleStartsAt" <= NOW()) AND (p."saleEndsAt" IS NULL OR p."saleEndsAt" > NOW()) THEN p."salePriceCents" ELSE p."priceCents" END`;
  const where = Prisma.sql`p."archived" = false AND p."categoryId" IS NOT NULL
 AND (${q} = '' OR p."name" ILIKE ${"%" + q + "%"} OR ${q} = ANY(p."tags"))
 AND (${value("category")} = '' OR c."slug" = ${value("category")})
 AND (${value("collection")} = '' OR p."collection" = ${value("collection")})
 AND (${price}) BETWEEN ${min} AND ${max}
 AND EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id" AND v."active" = true
 AND (${size} = '' OR v."size" = ${size}) AND (${color} = '' OR v."color" = ${color})
 AND (${value("available") !== "1"} OR v."stock" > 0))`;
  const order =
    value("sort") === "price-asc"
      ? Prisma.sql`${price} ASC`
      : value("sort") === "price-desc"
        ? Prisma.sql`${price} DESC`
        : value("sort") === "popular"
          ? Prisma.sql`p."popularity" DESC`
          : value("sort") === "newest"
            ? Prisma.sql`p."createdAt" DESC`
            : Prisma.sql`p."featured" DESC,p."sortOrder" ASC`;
  const [ids, counts] = await Promise.all([
    db.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT p."id" FROM "Product" p JOIN "Category" c ON c."id"=p."categoryId" WHERE ${where} ORDER BY ${order},p."id" ASC LIMIT 12 OFFSET ${(page - 1) * 12}`,
    ),
    db.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*) as count FROM "Product" p JOIN "Category" c ON c."id"=p."categoryId" WHERE ${where}`,
    ),
  ]);
  const found = await db.product.findMany({
    where: { id: { in: ids.map((p) => p.id) } },
    include: fashionInclude,
  });
  return {
    products: ids
      .map(({ id }) => found.find((p) => p.id === id)!)
      .filter(Boolean),
    count: Number(counts[0].count),
    page,
  };
}
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
