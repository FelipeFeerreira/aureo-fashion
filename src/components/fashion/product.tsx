"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Heart, ArrowRight, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { addBag } from "./store";
export type ProductView = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  original: number;
  sample: boolean;
  description: string;
  composition: string;
  fit: string;
  care: string;
  category: string;
  collection: string;
  images: { url: string; alt: string; color: string | null }[];
  variants: {
    id: string;
    size: string;
    color: string;
    colorHex: string;
    stock: number;
  }[];
  sizeChart: unknown;
};
const subs = new Set<() => void>();
function subscribe(f: () => void) {
  subs.add(f);
  window.addEventListener("storage", f);
  return () => {
    subs.delete(f);
    window.removeEventListener("storage", f);
  };
}
function saved() {
  try {
    return localStorage.getItem("aureo-wishlist") ?? "[]";
  } catch {
    return "[]";
  }
}
export function useWishlist(): string[] {
  const raw = useSyncExternalStore(subscribe, saved, () => "[]");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
export function Favorite({ id }: { id: string }) {
  const ids = useWishlist(),
    active = ids.includes(id);
  return (
    <button
      className={`favorite ${active ? "selected" : ""}`}
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={active}
      onClick={() => {
        try {
          localStorage.setItem(
            "aureo-wishlist",
            JSON.stringify(active ? ids.filter((x) => x !== id) : [...ids, id]),
          );
          subs.forEach((f) => f());
        } catch {}
      }}
    >
      <Heart size={19} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
export function ProductCard({ product: p }: { product: ProductView }) {
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link href={`/shop/${p.slug}`}>
          <Image
            src={p.images[0]?.url ?? "/images/tee.jpg"}
            alt={p.images[0]?.alt ?? p.name}
            fill
            sizes="(max-width: 760px) 44vw, 23vw"
          />
        </Link>
        <span className="product-label">
          {p.original > p.price
            ? "SELEÇÃO ESPECIAL"
            : p.collection.toUpperCase()}
        </span>
        <Favorite id={p.id} />
        <Link className="quick-link" href={`/shop/${p.slug}`}>
          Escolher tamanho <Plus size={16} />
        </Link>
      </div>
      <div className="product-caption">
        <Link href={`/shop/${p.slug}`}>
          <h3>{p.name}</h3>
          <p>
            {p.variants[0]?.color} · {p.category}
          </p>
        </Link>
        <span>
          {formatMoney(p.price)}
          {p.original > p.price && <del>{formatMoney(p.original)}</del>}
        </span>
      </div>
    </article>
  );
}
export function ProductDetail({ product: p }: { product: ProductView }) {
  const colors = [...new Set(p.variants.map((v) => v.color))],
    [color, setColor] = useState(colors[0] ?? ""),
    [size, setSize] = useState(""),
    [index, setIndex] = useState(0),
    [zoom, setZoom] = useState(false),
    [chart, setChart] = useState(false),
    [added, setAdded] = useState(false),
    [cep, setCep] = useState(""),
    [shipping, setShipping] = useState("");
  const images = p.images.filter((x) => !x.color || x.color === color),
    variant = p.variants.find((v) => v.color === color && v.size === size),
    photo = images[index] ?? images[0] ?? p.images[0];
  return (
    <>
      <div className="breadcrumb">
        <Link href="/shop">Todas as peças</Link> / {p.name}
      </div>
      <div className="detail-grid">
        <div>
          <button
            className="detail-photo"
            onClick={() => setZoom(true)}
            aria-label="Ampliar imagem"
          >
            <Image
              src={photo?.url ?? "/images/tee.jpg"}
              alt={photo?.alt ?? p.name}
              fill
              sizes="(max-width: 800px) 100vw, 60vw"
              priority
            />
            <span>Ampliar ↗</span>
          </button>
          <div className="thumbnails">
            {images.map((img, i) => (
              <button
                key={img.url + i}
                onClick={() => setIndex(i)}
                aria-label={`Foto ${i + 1}`}
                aria-pressed={index === i}
              >
                <Image src={img.url} alt={img.alt} width={80} height={100} />
              </button>
            ))}
          </div>
        </div>
        <div className="product-info">
          <span className="eyebrow">{p.collection} / Coleção 01</span>
          <h1>{p.name}</h1>
          <p>{p.tagline}</p>
          <div className="detail-price">
            {formatMoney(p.price)}{" "}
            {p.original > p.price && <del>{formatMoney(p.original)}</del>}
          </div>
          <p className="muted">
            {p.sample
              ? "Peça de demonstração · não disponível para venda real"
              : "Preço à vista"}
          </p>
          <fieldset>
            <legend>Cor: {color}</legend>
            <div className="swatches">
              {colors.map((c) => (
                <button
                  key={c}
                  aria-label={c}
                  aria-pressed={color === c}
                  style={{
                    background: p.variants.find((v) => v.color === c)?.colorHex,
                  }}
                  onClick={() => {
                    setColor(c);
                    setSize("");
                    setIndex(0);
                    setAdded(false);
                  }}
                />
              ))}
            </div>
          </fieldset>
          <div className="size-heading">
            <span>Tamanho: {size || "selecione"}</span>
            <button onClick={() => setChart(true)}>Guia de medidas ↗</button>
          </div>
          <div className="sizes">
            {[...new Set(p.variants.map((v) => v.size))]
              .sort(
                (a, b) =>
                  ["PP", "P", "M", "G", "GG", "XGG"].indexOf(a) -
                  ["PP", "P", "M", "G", "GG", "XGG"].indexOf(b),
              )
              .map((s) => (
                <button
                  key={s}
                  disabled={
                    !p.variants.some(
                      (v) => v.color === color && v.size === s && v.stock > 0,
                    )
                  }
                  aria-pressed={size === s}
                  onClick={() => {
                    setSize(s);
                    setAdded(false);
                  }}
                >
                  {s}
                </button>
              ))}
          </div>
          <div className="purchase">
            <button
              className="button"
              disabled={!variant || variant.stock < 1}
              onClick={() => {
                if (variant) {
                  addBag({
                    productId: p.id,
                    variantId: variant.id,
                    size: variant.size,
                    color: variant.color,
                    quantity: 1,
                    name: p.name,
                    image: photo?.url ?? "",
                    slug: p.slug,
                  });
                  setAdded(true);
                }
              }}
            >
              {added ? (
                <>
                  <Check size={18} /> Adicionado à sacola
                </>
              ) : (
                <>
                  Adicionar à sacola <ArrowRight size={18} />
                </>
              )}
            </button>
            <Favorite id={p.id} />
          </div>
          <p role="status" className="muted">
            {variant
              ? `${variant.stock} unidades no estoque de demonstração`
              : "Escolha cor e tamanho para continuar."}
          </p>
          <form
            className="cep"
            onSubmit={(e) => {
              e.preventDefault();
              setShipping(
                /^\d{5}-?\d{3}$/.test(cep)
                  ? "Cotação indisponível: transportadora ainda não configurada."
                  : "Informe um CEP válido com 8 dígitos.",
              );
            }}
          >
            <label htmlFor="cep">Calcular entrega</label>
            <div>
              <input
                id="cep"
                inputMode="numeric"
                placeholder="Seu CEP"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={9}
              />
              <button>Consultar</button>
            </div>
            <p role="status">{shipping}</p>
          </form>
          {[
            ["Sobre a peça", p.description],
            ["Composição e modelagem", p.composition + " " + p.fit],
            ["Cuidados", p.care],
          ].map(([title, text]) => (
            <details key={title}>
              <summary>
                {title}
                <Plus size={15} />
              </summary>
              <p>{text}</p>
            </details>
          ))}
          <details>
            <summary>
              Trocas e devoluções <Plus size={15} />
            </summary>
            <p>
              Política em revisão.{" "}
              <Link href="/policies/returns">Ler rascunho da política</Link>
            </p>
          </details>
        </div>
      </div>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="zoom-dialog">
          <DialogTitle>{p.name} — fotografia ilustrativa</DialogTitle>
          <div className="zoom-photo">
            <Image
              src={photo?.url ?? "/images/tee.jpg"}
              alt={photo?.alt ?? p.name}
              fill
              sizes="90vw"
              style={{ objectFit: "contain" }}
            />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={chart} onOpenChange={setChart}>
        <DialogContent>
          <DialogTitle>Guia de medidas</DialogTitle>
          <p>
            Medidas ilustrativas em cm. Substituir pelas medidas reais da peça.
          </p>
          <table>
            <thead>
              <tr>
                <th>Tamanho</th>
                <th>Largura</th>
                <th>Comprimento</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(p.sizeChart) ? p.sizeChart : []).map(
                (r: { size: string; chest: number; length: number }) => (
                  <tr key={r.size}>
                    <td>{r.size}</td>
                    <td>{r.chest}</td>
                    <td>{r.length}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function Wishlist({ products }: { products: ProductView[] }) {
  const ids = useWishlist(),
    selected = products.filter((p) => ids.includes(p.id));
  return selected.length ? (
    <div className="product-grid">
      {selected.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  ) : (
    <div className="empty">
      <Heart />
      <h2>Guarde o que tem a ver com você.</h2>
      <p>Toque no coração de uma peça para encontrá-la aqui.</p>
      <Link className="button" href="/shop">
        Explorar peças
      </Link>
    </div>
  );
}
