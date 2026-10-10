import localFont from "next/font/local";
import type { Metadata } from "next";
import { settings, categories } from "@/lib/fashion/catalog";
import { Chrome } from "@/components/fashion/chrome";
import "./globals.css";
const bodyFont = localFont({
  src: "../../public/fonts/manrope.woff2",
  variable: "--font-body",
  display: "swap",
});
const displayFont = localFont({
  src: "../../public/fonts/cormorant.woff2",
  variable: "--font-display",
  display: "swap",
});
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const s = await settings();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3200",
    ),
    title: { default: `${s.name} — ${s.slogan}`, template: `%s · ${s.name}` },
    description:
      "Herança, força e identidade. Streetwear contemporâneo com alma medieval. Loja em demonstração.",
  };
}
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [s, c] = await Promise.all([settings(), categories()]);
  return (
    <html
      className={`${bodyFont.variable} ${displayFont.variable}`}
      lang="pt-BR"
      data-scroll-behavior="smooth"
    >
      <body style={{ "--brand-accent": s.accent } as React.CSSProperties}>
        <a className="skip" href="#main">
          Pular para o conteúdo
        </a>
        <Chrome settings={s} categories={c}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
