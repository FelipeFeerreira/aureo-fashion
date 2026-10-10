import Image from "next/image";
import Link from "next/link";
import { settings } from "@/lib/fashion/catalog";
import { Emblem } from "@/components/fashion/brand";
export default async function Page() {
  const s = await settings(),
    e = s.editorial;
  return (
    <>
      <section className="section prose-page">
        <Emblem monogram={e.monogram} />
        <span className="eyebrow">UNIVERSO {s.name}</span>
        <h1>{e.manifestoTitle}</h1>
        <p>{e.manifestoText}</p>
        <p>{e.footerText}</p>
        <Link className="button" href="/shop">
          Explore o catálogo →
        </Link>
      </section>
      <div className="about-photo">
        <Image
          src={e.campaignImage}
          alt="Referência editorial da marca"
          fill
          sizes="100vw"
        />
      </div>
      <section className="section prose-page">
        <h2>Transparência desde o início.</h2>
        <p>
          Este é o ambiente demonstrativo da marca. Produtos, composições e
          estoques marcados como exemplos não representam mercadorias
          disponíveis para compra real. A campanha apresenta referências visuais
          da T Knights Mark, separadas das fotografias ilustrativas de produtos
          do Unsplash. Pagamentos reais permanecem desativados.
        </p>
      </section>
    </>
  );
}
