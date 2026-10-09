import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3200";
  const products = await db.product.findMany({
    where: { archived: false, categoryId: { not: null } },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: base },
    { url: base + "/shop" },
    { url: base + "/about" },
    ...products.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];
}
