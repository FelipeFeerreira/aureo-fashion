import { effectivePrice, type FashionProduct } from "./catalog";
export function productView(p: FashionProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    price: effectivePrice(p),
    original: p.priceCents,
    sample: p.sample,
    description: p.description,
    composition: p.composition,
    fit: p.fit,
    care: p.care,
    category: p.category?.name ?? "",
    collection: p.collection,
    images: p.images.map((x) => ({ url: x.url, alt: x.alt, color: x.color })),
    variants: p.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      stock: v.stock,
    })),
    sizeChart: p.sizeChart,
  };
}
