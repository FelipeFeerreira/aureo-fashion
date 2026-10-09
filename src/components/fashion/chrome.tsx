"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, Heart, ShoppingBag, ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useFashionCart } from "./store";
import { Assistant } from "./assistant";
import { Bag } from "./shopping";
export function Chrome({
  children,
  settings: s,
  categories,
}: {
  children: React.ReactNode;
  settings: { name: string; slogan: string; announcement: string };
  categories: { slug: string; name: string }[];
}) {
  const path = usePathname(),
    [menu, setMenu] = useState(false),
    [bag, setBag] = useState(false);
  const items = useFashionCart();
  if (path.startsWith("/admin")) return <main id="main">{children}</main>;
  return (
    <>
      <div className="announcement">
        {s.announcement}
        <span>BRASIL · EST. 2026</span>
      </div>
      <header className="fashion-header">
        <button
          className="mobile-only icon"
          aria-label="Abrir menu"
          onClick={() => setMenu(true)}
        >
          <Menu size={21} />
        </button>
        <Link className="wordmark" href="/">
          {s.name}
          <small>ESTÚDIO DE ESSENCIAIS</small>
        </Link>
        <nav className="desktop-nav">
          <Link href="/shop">Todas as peças</Link>
          {categories.slice(0, 3).map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <Link href="/about">Universo {s.name}</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon" href="/shop#search" aria-label="Buscar">
            <Search size={20} />
          </Link>
          <Link className="icon" href="/wishlist" aria-label="Favoritos">
            <Heart size={20} />
          </Link>
          <button
            className="icon bag-icon"
            onClick={() => setBag(true)}
            aria-label={`Abrir sacola, ${items.reduce((n, x) => n + x.quantity, 0)} itens`}
          >
            <ShoppingBag size={20} />
            <span>{items.reduce((n, x) => n + x.quantity, 0)}</span>
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      {process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === "true" && <Assistant />}
      <footer>
        <div className="footer-top">
          <div>
            <Link className="wordmark" href="/">
              {s.name}
            </Link>
            <p>
              {s.slogan}
              <br />
              Feito para fazer parte.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/shop">Todas as peças</Link>
            <Link href="/shop?collection=Essentials">Essentials</Link>
            <Link href="/about">Nossa essência</Link>
          </div>
          <div>
            <h3>Podemos ajudar?</h3>
            <Link href="/track-order">Acompanhe seu pedido</Link>
            <Link href="/policies/shipping">Entrega e frete</Link>
            <Link href="/policies/returns">Trocas e devoluções</Link>
            <Link href="/faq">Dúvidas frequentes</Link>
          </div>
          <div>
            <h3>Transparência</h3>
            <Link href="/policies/privacy">Privacidade</Link>
            <Link href="/policies/terms">Termos de uso</Link>
            <Link href="/admin">
              Área da marca <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.name} · Brasil
          </span>
          <span>
            Loja demonstrativa · imagens ilustrativas · pagamentos reais
            desativados
          </span>
        </div>
      </footer>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left">
          <SheetTitle>Explore {s.name}</SheetTitle>
          <nav className="mobile-nav">
            {[{ slug: "", name: "Todas as peças" }, ...categories].map((c) => (
              <Link
                onClick={() => setMenu(false)}
                key={c.slug}
                href={`/shop${c.slug ? "?category=" + c.slug : ""}`}
              >
                {c.name}
              </Link>
            ))}
            <Link href="/about" onClick={() => setMenu(false)}>
              Nossa essência
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Sheet open={bag} onOpenChange={setBag}>
        <SheetContent className="bag-sheet">
          <SheetTitle>Sua sacola</SheetTitle>
          <Bag compact onNavigate={() => setBag(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
