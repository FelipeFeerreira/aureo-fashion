import Link from "next/link";
import { db } from "@/lib/db";
import { catalog, categories } from "@/lib/fashion/catalog";
import { productView } from "@/lib/fashion/view";
import { ProductCard } from "@/components/fashion/product";
export const metadata = { title: "Todas as peças" };
export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams,
    [data, cats, variants] = await Promise.all([
      catalog(params),
      categories(),
      db.productVariant.findMany({
        where: {
          active: true,
          product: { archived: false, categoryId: { not: null } },
        },
        distinct: ["size", "color"],
        select: { size: true, color: true },
      }),
    ]);
  const val = (k: string) => (typeof params[k] === "string" ? params[k] : "");
  return (
    <div className="section catalog">
      <div className="catalog-title">
        <span className="eyebrow">O CATÁLOGO / IDENTIDADE EM CADA PEÇA</span>
        <h1>
          {cats.find((c) => c.slug === val("category"))?.name ??
            "Todas as peças"}
        </h1>
        <p>Escolha sua forma de carregar o legado.</p>
      </div>
      <form className="filters" action="/shop">
        {val("collection") && <input type="hidden" name="collection" value={val("collection")}/> }
        <label className="search-field">
          Buscar
          <input
            id="search"
            name="q"
            defaultValue={val("q")}
            placeholder="O que você procura?"
          />
        </label>
        <label>
          Categoria
          <select
            aria-label="Categoria"
            name="category"
            defaultValue={val("category")}
          >
            <option value="">Todas</option>
            {cats.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tamanho
          <select aria-label="Tamanho" name="size" defaultValue={val("size")}>
            <option value="">Todos</option>
            {[...new Set(variants.map((v) => v.size))]
              .sort(
                (a, b) =>
                  ["PP", "P", "M", "G", "GG", "XGG"].indexOf(a) -
                  ["PP", "P", "M", "G", "GG", "XGG"].indexOf(b),
              )
              .map((x) => (
                <option key={x}>{x}</option>
              ))}
          </select>
        </label>
        <label>
          Cor
          <select aria-label="Cor" name="color" defaultValue={val("color")}>
            <option value="">Todas</option>
            {[...new Set(variants.map((v) => v.color))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          De R$
          <input
            type="number"
            name="min"
            min="0"
            placeholder="0"
            defaultValue={val("min")}
          />
        </label>
        <label>
          Até R$
          <input
            type="number"
            name="max"
            min="0"
            placeholder="Sem limite"
            defaultValue={val("max")}
          />
        </label>
        <label>
          Ordenar
          <select aria-label="Ordenar" name="sort" defaultValue={val("sort")}>
            <option value="featured">Destaques</option>
            <option value="newest">Novidades</option>
            <option value="popular">Popularidade</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={val("available") === "1"}
          />
          Disponíveis
        </label>
        <button className="button">Filtrar</button>
        <Link href="/shop">Limpar</Link>
      </form>
      <div className="catalog-count">
        {data.count} peças · catálogo demonstrativo
      </div>
      {data.products.length ? (
        <div className="product-grid">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={productView(p)} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Nenhuma peça por aqui.</h2>
          <p>Experimente outro tamanho, cor ou faixa de preço.</p>
          <Link href="/shop">Limpar filtros →</Link>
        </div>
      )}
      <nav className="pagination" aria-label="Paginação">
        {Array.from({ length: Math.ceil(data.count / 12) }, (_, i) => {
          const query = new URLSearchParams();
          Object.entries(params).forEach(([k, v]) => {
            if (typeof v === "string") query.set(k, v);
          });
          query.set("page", String(i + 1));
          return (
            <Link
              key={i}
              aria-current={data.page === i + 1 ? "page" : undefined}
              href={`/shop?${query}`}
            >
              {i + 1}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
