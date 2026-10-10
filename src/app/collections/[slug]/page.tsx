import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { settings, fashionInclude } from "@/lib/fashion/catalog";
import { db } from "@/lib/db";
import { productView } from "@/lib/fashion/view";
import { ProductCard } from "@/components/fashion/product";
export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const s = await settings();
  const c = s.editorial.collections.find((c) => c.slug === slug);
  return { title: c?.title ?? "Coleção", description: c?.description };
}
export default async function Collection({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const s = await settings();
  const c = s.editorial.collections.find((c) => c.slug === slug);
  if (!c) notFound();
  const products = await db.product.findMany({
    where: {
      id: { in: c.productIds },
      archived: false,
      categoryId: { not: null },
    },
    include: fashionInclude,
  });
  products.sort(
    (a, b) => c.productIds.indexOf(a.id) - c.productIds.indexOf(b.id),
  );
  return (
    <>
      <section className="collection-intro">
        <Image
          src={c.image}
          alt={`Editorial ${c.title}`}
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div>
          <span className="eyebrow">UNIVERSO {s.name}</span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
        </div>
      </section>
      <section className="section">
        <p className="collection-statement">{c.campaign}</p>
        {products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={productView(p)} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Uma história em construção.</h2>
            <p>
              Este conceito ainda não tem peças vinculadas. Nenhum lançamento ou
              estoque está anunciado.
            </p>
            <Link className="button" href="/shop">
              Explorar o catálogo
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
