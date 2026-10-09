"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AdminLogout } from "@/components/admin/access";
import { formatMoney } from "@/lib/money";
type Variant = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  active: boolean;
};
type Media = {
  url: string;
  alt: string;
  color: string | null;
  storageKey?: string | null;
};
export type EditableProduct = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  categoryId: string;
  collection: string;
  composition: string;
  fit: string;
  care: string;
  priceCents: number;
  salePriceCents: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  featured: boolean;
  archived: boolean;
  sample: boolean;
  tags: string[];
  sizeChart: { size: string; chest: number; length: number }[];
  variants: Variant[];
  images: Media[];
};
type Settings = {
  name: string;
  slogan: string;
  announcement: string;
  heroImage: string;
  heroTitle: string;
  accent: string;
  privacyDraft: string;
  shippingDraft: string;
  returnsDraft: string;
  termsDraft: string;
};
type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
};
type Order = {
  id: string;
  number: string;
  email: string | null;
  customerName: string | null;
  status: string;
  totalCents: number;
  trackingNumber: string | null;
  createdAt: string;
  items: {
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
  }[];
};
const blank = (categoryId: string): EditableProduct => ({
  name: "Nova peça",
  slug: "nova-peca",
  tagline: "O essencial tem presença.",
  description: "",
  categoryId,
  collection: "Essentials",
  composition: "",
  fit: "",
  care: "",
  priceCents: 15900,
  salePriceCents: null,
  saleStartsAt: null,
  saleEndsAt: null,
  featured: false,
  archived: true,
  sample: true,
  tags: [],
  sizeChart: [],
  variants: [
    {
      sku: "NOVO-P",
      size: "P",
      color: "Preto",
      colorHex: "#151515",
      stock: 0,
      active: true,
    },
  ],
  images: [],
});
export function FashionAdmin({
  products,
  categories,
  settings,
  orders,
  metrics,
}: {
  products: EditableProduct[];
  categories: Category[];
  settings: Settings;
  orders: Order[];
  metrics: { orders: number; revenue: number; customers: number };
}) {
  const router = useRouter(),
    [tab, setTab] = useState("Produtos"),
    [product, setProduct] = useState(
      products[0] ?? blank(categories[0]?.id ?? ""),
    ),
    [brand, setBrand] = useState(settings),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState<number | null>(null);
  async function post(path: string, data: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage(result.message ?? "Salvo.");
      router.refresh();
      return result;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const additions: Media[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const r = await fetch("/api/admin/media", {
          method: "POST",
          body: form,
        });
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        additions.push({ ...data, color: null });
      }
      setProduct((p) => ({
        ...p,
        images: [...p.images, ...additions].slice(0, 20),
      }));
      setMessage("Imagens enviadas. Salve o produto para confirmar a ordem.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }
  function move(from: number, to: number) {
    setProduct((p) => {
      const images = [...p.images];
      const [item] = images.splice(from, 1);
      images.splice(to, 0, item);
      return { ...p, images };
    });
  }
  const fields: [keyof EditableProduct, string][] = [
    ["name", "Nome"],
    ["slug", "Endereço do produto"],
    ["tagline", "Frase curta"],
    ["collection", "Coleção"],
    ["composition", "Composição"],
    ["fit", "Modelagem"],
    ["care", "Cuidados"],
  ];
  return (
    <div className="admin-shell">
      <div className="admin-top">
        <Link href="/" className="wordmark">
          {brand.name}
        </Link>
        <span>ESPAÇO DA MARCA</span>
        <AdminLogout />
      </div>
      <nav className="admin-tabs">
        {[
          "Produtos",
          "Pedidos",
          "Clientes",
          "Marca e conteúdo",
          "Categorias",
          "Indicadores",
        ].map((t) => (
          <button
            key={t}
            aria-pressed={t === tab}
            onClick={() => {
              setTab(t);
              setMessage("");
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      <p role="status" className={message.includes("Falha") ? "error" : ""}>
        {message}
      </p>
      {tab === "Produtos" && (
        <div className="admin-grid">
          <aside className="admin-list">
            <button
              className="button"
              onClick={() => setProduct(blank(categories[0]?.id ?? ""))}
            >
              + Criar produto
            </button>
            {products.map((p) => (
              <button
                key={p.id}
                aria-pressed={p.id === product.id}
                onClick={() => setProduct(p)}
              >
                {p.name}
                <small
                  style={{ display: "block", color: "#777", marginTop: 5 }}
                >
                  {p.archived ? "Arquivado" : "Publicado"} ·{" "}
                  {formatMoney(p.priceCents)}
                </small>
              </button>
            ))}
          </aside>
          <form
            className="admin-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await post("products", product);
              if (result?.id) setProduct((p) => ({ ...p, id: result.id }));
            }}
          >
            <h2 className="wide">{product.id ? "Editar peça" : "Nova peça"}</h2>
            {fields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required={key === "name" || key === "slug"}
                  value={String(product[key] ?? "")}
                  onChange={(e) =>
                    setProduct({ ...product, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Categoria
              <select
                value={product.categoryId}
                onChange={(e) =>
                  setProduct({ ...product, categoryId: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preço (centavos)
              <input
                type="number"
                min="1"
                value={product.priceCents}
                onChange={(e) =>
                  setProduct({ ...product, priceCents: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Preço promocional (centavos)
              <input
                type="number"
                min="1"
                value={product.salePriceCents ?? ""}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    salePriceCents: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </label>
            {(["saleStartsAt", "saleEndsAt"] as const).map((k, i) => (
              <label key={k}>
                {i ? "Fim" : "Início"} da promoção (UTC)
                <input
                  type="datetime-local"
                  value={product[k]?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      [k]: e.target.value
                        ? new Date(e.target.value + "Z").toISOString()
                        : null,
                    })
                  }
                />
              </label>
            ))}
            <label className="wide">
              Descrição
              <textarea
                rows={4}
                value={product.description}
                onChange={(e) =>
                  setProduct({ ...product, description: e.target.value })
                }
              />
            </label>
            <label>
              Tags (separadas por vírgula)
              <input
                value={product.tags.join(",")}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    tags: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <div>
              {(["featured", "archived", "sample"] as const).map((k, i) => (
                <label key={k} style={{ flexDirection: "row", margin: 10 }}>
                  <input
                    style={{ width: "auto" }}
                    type="checkbox"
                    checked={product[k]}
                    onChange={(e) =>
                      setProduct({ ...product, [k]: e.target.checked })
                    }
                  />
                  {
                    [
                      "Destaque na página inicial",
                      "Arquivado (oculto na loja)",
                      "Produto ilustrativo",
                    ][i]
                  }
                </label>
              ))}
            </div>
            <section className="wide">
              <h3>Variantes e estoque</h3>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      {["SKU", "Tamanho", "Cor", "Tom", "Estoque", ""].map(
                        (x, i) => (
                          <th key={i}>{x}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v, i) => (
                      <tr key={i}>
                        {(
                          ["sku", "size", "color", "colorHex", "stock"] as const
                        ).map((k) => (
                          <td key={k}>
                            <input
                              aria-label={`${k} variante ${i + 1}`}
                              type={
                                k === "stock"
                                  ? "number"
                                  : k === "colorHex"
                                    ? "color"
                                    : "text"
                              }
                              style={{ minWidth: k === "sku" ? 110 : 65 }}
                              min="0"
                              value={v[k]}
                              onChange={(e) =>
                                setProduct({
                                  ...product,
                                  variants: product.variants.map((x, j) =>
                                    i === j
                                      ? {
                                          ...x,
                                          [k]:
                                            k === "stock"
                                              ? Number(e.target.value)
                                              : e.target.value,
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              setProduct({
                                ...product,
                                variants: product.variants.filter(
                                  (_, j) => i !== j,
                                ),
                              })
                            }
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setProduct({
                    ...product,
                    variants: [
                      ...product.variants,
                      {
                        sku: "",
                        size: "M",
                        color: "Preto",
                        colorHex: "#151515",
                        stock: 0,
                        active: true,
                      },
                    ],
                  })
                }
              >
                + Adicionar variante
              </button>
            </section>
            <section className="wide">
              <h3>Fotografias · primeira imagem é a capa</h3>
              <p className="muted">
                Arraste para ordenar ou use as setas. Remover uma foto a
                desvincula da peça; o original permanece no armazenamento para
                recuperação.
              </p>
              <div
                className="upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void upload(e.dataTransfer.files);
                }}
              >
                <label>
                  Arraste fotos ou selecione arquivos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={busy}
                    onChange={(e) => void upload(e.target.files)}
                  />
                </label>
                <small>
                  JPG, PNG ou WebP · até 5 MB · armazenamento persistente
                  Cloudinary
                </small>
              </div>
              <div className="media-list">
                {product.images.map((img, i) => (
                  <div
                    className="media-item"
                    key={img.url + i}
                    draggable
                    onDragStart={() => setDrag(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag !== null) move(drag, i);
                      setDrag(null);
                    }}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      width={145}
                      height={170}
                    />
                    <label>
                      Texto alternativo
                      <input
                        value={img.alt}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            images: product.images.map((x, j) =>
                              i === j ? { ...x, alt: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      Cor (vazio: todas)
                      <input
                        value={img.color ?? ""}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            images: product.images.map((x, j) =>
                              i === j
                                ? { ...x, color: e.target.value || null }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={i === product.images.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      →
                    </button>
                    <button type="button" onClick={() => move(i, 0)}>
                      Capa
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProduct({
                          ...product,
                          images: product.images.filter((_, j) => i !== j),
                        })
                      }
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </section>
            <section className="wide">
              <h3>Guia de medidas (cm)</h3>
              {product.sizeChart.map((row, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 10, marginTop: 10 }}
                >
                  {(["size", "chest", "length"] as const).map((k) => (
                    <label key={k}>
                      {k === "size"
                        ? "Tamanho"
                        : k === "chest"
                          ? "Largura"
                          : "Comprimento"}
                      <input
                        type={k === "size" ? "text" : "number"}
                        value={row[k]}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            sizeChart: product.sizeChart.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    [k]:
                                      k === "size"
                                        ? e.target.value
                                        : Number(e.target.value),
                                  }
                                : r,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setProduct({
                    ...product,
                    sizeChart: [
                      ...product.sizeChart,
                      { size: "M", chest: 54, length: 72 },
                    ],
                  })
                }
              >
                + Adicionar medida
              </button>
            </section>
            <button className="button wide" disabled={busy}>
              {busy ? "Salvando…" : "Salvar produto"}
            </button>
          </form>
        </div>
      )}
      {tab === "Marca e conteúdo" && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            void post("settings", brand);
          }}
        >
          {(Object.keys(brand) as (keyof Settings)[])
            .filter((k) => String(k) !== "id")
            .map((k) => (
              <label key={k} className={k.endsWith("Draft") ? "wide" : ""}>
                {(
                  {
                    name: "Nome da marca",
                    slogan: "Slogan",
                    announcement: "Faixa de anúncio",
                    heroImage: "Imagem principal (URL da biblioteca)",
                    heroTitle: "Título principal",
                    accent: "Cor principal",
                    privacyDraft: "Privacidade — rascunho",
                    shippingDraft: "Entrega — rascunho",
                    returnsDraft: "Trocas — rascunho",
                    termsDraft: "Termos — rascunho",
                  } as Record<string, string>
                )[k] ?? k}
                {k.endsWith("Draft") ? (
                  <textarea
                    rows={4}
                    value={brand[k]}
                    onChange={(e) =>
                      setBrand({ ...brand, [k]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    value={brand[k]}
                    onChange={(e) =>
                      setBrand({ ...brand, [k]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          <button className="button wide" disabled={busy}>
            Salvar identidade e conteúdo
          </button>
        </form>
      )}
      {tab === "Pedidos" && (
        <div>
          <h2>Pedidos de teste</h2>
          {orders.length === 0 ? (
            <p className="empty">
              Nenhum pedido. As métricas não incluem vendas fictícias.
            </p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="order-summary"
                style={{ marginTop: 20 }}
              >
                <h3>
                  {o.number} · {o.status}
                </h3>
                <p>
                  {o.customerName} · {o.email} · {formatMoney(o.totalCents)}
                </p>
                {o.items.map((i, n) => (
                  <p key={n}>
                    {i.quantity} × {i.name} / {i.color} / {i.size}
                  </p>
                ))}
                {["PAID", "SHIPPED"].includes(o.status) && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void post("orders", {
                        id: o.id,
                        status: o.status === "PAID" ? "SHIPPED" : "DELIVERED",
                        trackingNumber: f.get("trackingNumber"),
                      });
                    }}
                  >
                    <label>
                      Rastreamento
                      <input
                        name="trackingNumber"
                        defaultValue={o.trackingNumber ?? ""}
                        required
                      />
                    </label>
                    <button className="button" disabled={busy}>
                      {o.status === "PAID"
                        ? "Marcar como enviado"
                        : "Marcar como entregue"}
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {tab === "Clientes" && (
        <>
          <h2>Clientes e histórico</h2>
          <p className="muted">
            Dados dos últimos 100 pedidos. Acesso restrito à marca.
          </p>
          {[...new Set(orders.map((o) => o.email).filter(Boolean))].map(
            (email) => (
              <details key={email}>
                <summary>{email}</summary>
                {orders
                  .filter((o) => o.email === email)
                  .map((o) => (
                    <p key={o.id}>
                      {o.number} · {o.status} · {formatMoney(o.totalCents)}
                    </p>
                  ))}
              </details>
            ),
          )}
        </>
      )}
      {tab === "Categorias" && (
        <>
          <h2>Categorias da navegação</h2>
          {[
            ...categories,
            {
              id: "",
              name: "",
              slug: "",
              imageUrl: "/images/tee.jpg",
              sortOrder: categories.length,
            },
          ].map((c, i) => (
            <form
              className="admin-form"
              key={c.id || "new"}
              style={{ marginTop: 25 }}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void post("categories", {
                  ...(c.id ? { id: c.id } : {}),
                  name: f.get("name"),
                  slug: f.get("slug"),
                  imageUrl: f.get("imageUrl"),
                  sortOrder: Number(f.get("sortOrder")),
                });
              }}
            >
              <h3 className="wide">{c.id ? c.name : "Nova categoria"}</h3>
              {(["name", "slug", "imageUrl", "sortOrder"] as const).map((k) => (
                <label key={k}>
                  {
                    {
                      name: "Nome",
                      slug: "Endereço",
                      imageUrl: "Imagem (URL)",
                      sortOrder: "Ordem",
                    }[k]
                  }
                  <input
                    name={k}
                    defaultValue={c[k]}
                    required
                    type={k === "sortOrder" ? "number" : "text"}
                  />
                </label>
              ))}
              <button className="button" disabled={busy}>
                Salvar categoria {i + 1}
              </button>
            </form>
          ))}
        </>
      )}
      {tab === "Indicadores" && (
        <>
          <h2>Visão da operação</h2>
          <p>Ambiente de teste. Estes valores não representam receita real.</p>
          <div className="metrics">
            <div>
              Pedidos<strong>{metrics.orders}</strong>
            </div>
            <div>
              Total confirmado em teste
              <strong>{formatMoney(metrics.revenue)}</strong>
            </div>
            <div>
              Clientes com pedidos<strong>{metrics.customers}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
