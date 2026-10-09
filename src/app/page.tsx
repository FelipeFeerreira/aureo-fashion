import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { settings, catalog, categories } from "@/lib/fashion/catalog";
import { productView } from "@/lib/fashion/view";
import { ProductCard } from "@/components/fashion/product";
import { Newsletter } from "@/components/fashion/shopping";
export default async function Home() {
  const [s, { products }, cats] = await Promise.all([
    settings(),
    catalog(),
    categories(),
  ]);
  return (
    <>
      <section className="hero">
        <Image
          src={s.heroImage}
          alt="Editorial de moda — fotografia de inspiração ilustrativa"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-top">
          {s.name} JOURNAL <span>VOL. 01 / ESSENCIAIS</span>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">PARA TODOS OS SEUS DIAS</span>
          <h1>{s.heroTitle}</h1>
          <Link className="button light" href="/shop">
            Explore a coleção <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="hero-bottom">
          <span>Formas simples. Possibilidades infinitas.</span>
          <span>01 — 03</span>
        </div>
      </section>
      <div className="manifesto-line">
        <span>DESENHO COM INTENÇÃO</span>
        <span>CONFORTO SEM EXCESSO</span>
        <span>ESSENCIAIS COM IDENTIDADE</span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A SUA PRÓXIMA PEÇA FAVORITA</span>
            <h2>Essenciais, nada básicos.</h2>
          </div>
          <Link href="/shop?collection=Essentials">
            Ver a coleção <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard product={productView(p)} key={p.id} />
          ))}
        </div>
      </section>
      <section className="story-strip">
        <span className="eyebrow">A ESSÊNCIA {s.name}</span>
        <h2>
          Vestir menos tendências.
          <br />
          Vestir mais de você.
        </h2>
        <p>
          Acreditamos na força do simples. Em peças que abrem espaço para a sua
          personalidade. Em um guarda-roupa que faz sentido, todos os dias.
        </p>
        <Link className="text-link" href="/about">
          Conheça nosso universo <ArrowRight size={17} />
        </Link>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ENCONTRE SEU RITMO</span>
            <h2>Um essencial para cada momento.</h2>
          </div>
        </div>
        <div className="category-grid">
          {cats.slice(0, 3).map((c, i) => (
            <Link href={`/shop?category=${c.slug}`} key={c.id}>
              <Image
                src={c.imageUrl}
                alt={`Referência de ${c.name}`}
                fill
                sizes="(max-width: 760px) 68vw, 30vw"
              />
              <div>
                <span>0{i + 1}</span>
                <h3>{c.name}</h3>
                <ArrowUpRight />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="campaign">
        <div className="campaign-photo">
          <Image
            src="/images/campaign.jpg"
            alt="Inspiração de guarda-roupa contemporâneo"
            fill
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        </div>
        <div className="campaign-copy">
          <span className="eyebrow">BEM-VINDO AO SEU COTIDIANO</span>
          <h2>
            Presença.
            <br />
            Sem esforço.
          </h2>
          <p>
            Texturas que convidam ao toque. Silhuetas que deixam você à vontade.
            Um novo olhar para aquilo que você veste sempre.
          </p>
          <Link className="button" href="/shop?sort=newest">
            Descubra as novidades <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACABARAM DE CHEGAR</span>
            <h2>Novos encontros.</h2>
          </div>
          <Link href="/shop?sort=newest">
            Ver novidades <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(4, 8).map((p) => (
            <ProductCard key={p.id} product={productView(p)} />
          ))}
        </div>
      </section>
      <section className="feature-band">
        <span>01 / O DETALHE FAZ A DIFERENÇA</span>
        <h2>O essencial é sentir-se bem.</h2>
        <p>
          Explore modelagens, composição e medidas em cada peça. Escolhas
          conscientes começam com informação.
        </p>
        <Link href="/shop?sort=popular">
          Explore os destaques <ArrowRight size={18} />
        </Link>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SELEÇÃO EDITORIAL · DEMONSTRAÇÃO</span>
            <h2>Os favoritos do cotidiano.</h2>
          </div>
          <Link href="/shop?sort=popular">Explorar destaques ↗</Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={productView(p)} />
          ))}
        </div>
      </section>
      <Newsletter />
    </>
  );
}
