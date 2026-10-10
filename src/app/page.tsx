import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { settings, fashionInclude } from "@/lib/fashion/catalog";
import { db } from "@/lib/db";
import { productView } from "@/lib/fashion/view";
import { ProductCard } from "@/components/fashion/product";
import { Newsletter } from "@/components/fashion/shopping";
import { Emblem } from "@/components/fashion/brand";
export default async function Home() {
  const s = await settings(),
    e = s.editorial;
  const selected = await db.product.findMany({
    where: { archived: false, categoryId: { not: null }, featured: true },
    include: fashionInclude,
    orderBy: [{ popularity: "desc" }, { sortOrder: "asc" }],
    take: 4,
  });
  const arrivals = await db.product.findMany({
    where: {
      archived: false,
      categoryId: { not: null },
      id: { notIn: selected.map((p) => p.id) },
    },
    include: fashionInclude,
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return (
    <>
      <section className="hero">
        <Image
          src={s.heroImage}
          alt="Editorial da marca — referência visual, sem vínculo com o estoque demonstrativo"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          style={{ objectPosition: e.heroPosition }}
        />
        <div className="hero-shade" />
        <div className="hero-top">
          <span>{s.name} / ESTÚDIO BRASIL</span>
          <span>EXPRESSÃO CONTEMPORÂNEA</span>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">{e.heroLabel}</span>
          <h1>{s.heroTitle}</h1>
          <p>{e.heroDescription}</p>
          <Link className="button light" href="/shop">
            Explorar coleção <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="hero-bottom">
          <span>HERANÇA. FORÇA. IDENTIDADE.</span>
          <span>IMAGEM EDITORIAL · I</span>
        </div>
      </section>
      <div className="manifesto-line">
        <span>HERANÇA MEDIEVAL</span>
        <span>ESPÍRITO CONTEMPORÂNEO</span>
        <span>IDENTIDADE SEM CONCESSÕES</span>
      </div>
      <section className="section" id="collections">
        <div className="section-heading">
          <div>
            <span className="eyebrow">I / UNIVERSOS DA MARCA</span>
            <h2>Uma marca. Muitas histórias.</h2>
          </div>
          <span className="muted">Conceitos editoriais</span>
        </div>
        <div className="collection-grid">
          {e.collections.map((c, i) => (
            <Link
              className="collection-tile"
              href={`/collections/${c.slug}`}
              key={c.slug}
            >
              <Image
                src={c.image}
                alt={`Referência editorial — ${c.title}`}
                fill
                sizes="(max-width: 760px) 90vw, 45vw"
              />
              <div className="collection-overlay" />
              <div className="collection-copy">
                <span className="eyebrow">
                  {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i]} /
                  CONCEITO EDITORIAL
                </span>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <span className="text-link">
                  Conheça o universo <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {selected.length > 0 && (
        <section className="section selection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">II / SELEÇÃO DA MARCA</span>
              <h2>Peças com presença.</h2>
            </div>
            <Link href="/shop">
              Ver todas as peças <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="product-grid">
            {selected.map((p) => (
              <ProductCard key={p.id} product={productView(p)} />
            ))}
          </div>
        </section>
      )}
      <section className="story-strip">
        <Emblem monogram={e.monogram} />
        <span className="eyebrow">O MANIFESTO / {s.name}</span>
        <h2>{e.manifestoTitle}</h2>
        <p>{e.manifestoText}</p>
        <Link className="text-link" href="/about">
          Conheça nossa história <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="campaign">
        <div className="campaign-photo">
          <Image
            src={e.campaignImage}
            alt="Campanha editorial da marca, apresentada como referência visual"
            fill
            sizes="(max-width: 760px) 100vw, 55vw"
          />
        </div>
        <div className="campaign-copy">
          <span className="eyebrow">III / A ASSINATURA</span>
          <h2>{e.campaignTitle}</h2>
          <p>{e.campaignText}</p>
          <Link className="text-link" href="/shop">
            Explore as peças <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      {arrivals.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">IV / NOVOS CAPÍTULOS</span>
              <h2>Novas presenças.</h2>
            </div>
            <Link href="/shop?sort=newest">
              Ver novidades <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="product-grid">
            {arrivals.map((p) => (
              <ProductCard key={p.id} product={productView(p)} />
            ))}
          </div>
        </section>
      )}
      <section className="feature-band">
        <span>O VALOR DO DETALHE</span>
        <h2>{e.detailTitle}</h2>
        <p>{e.detailText}</p>
        <Link href="/shop">
          Conheça cada peça <ArrowUpRight size={18} />
        </Link>
      </section>
      <Newsletter title={e.newsletterTitle} description={e.newsletterText} />
    </>
  );
}
