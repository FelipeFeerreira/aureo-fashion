import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fashionInclude, catalog } from "@/lib/fashion/catalog";
import { productView } from "@/lib/fashion/view";
import { ProductDetail, ProductCard } from "@/components/fashion/product";
async function get(slug: string) {
  return db.product.findFirst({
    where: { slug, archived: false, categoryId: { not: null } },
    include: fashionInclude,
  });
}
export async function generateMetadata({ params }: PageProps<"/shop/[slug]">) {
  const p = await get((await params).slug);
  return {
    title: p?.name ?? "Peça não encontrada",
    description: p?.description,
  };
}
export default async function Page({ params }: PageProps<"/shop/[slug]">) {
  const p = await get((await params).slug);
  if (!p) notFound();
  const related = await catalog({ category: p.category?.slug });
  const view = productView(p);
  return (
    <div className="section detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description,
            image: p.images.map((i) => i.url),
            ...(p.sample
              ? {}
              : {
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "BRL",
                    price: view.price / 100,
                    availability: p.variants.some((v) => v.stock > 0)
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                  },
                }),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail product={view} />
      <section className="related">
        <div className="section-heading">
          <h2>Boas companhias.</h2>
          <span>COMPLETE O SEU ESTILO</span>
        </div>
        <div className="product-grid">
          {related.products
            .filter((x) => x.id !== p.id)
            .slice(0, 4)
            .map((x) => (
              <ProductCard key={x.id} product={productView(x)} />
            ))}
        </div>
      </section>
    </div>
  );
}
