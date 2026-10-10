import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/orders/track-order-form";

export const metadata: Metadata = { title: "Acompanhe seu pedido", robots: { index: false, follow: false } };

export default function TrackOrderPage() {
  return <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
    <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">SUAS ESCOLHAS, A CADA ETAPA</p>
    <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Acompanhe seu pedido</h1>
    <p className="mt-4 mb-8 leading-relaxed text-muted-foreground">Informe o número e o e-mail usados no checkout para consultar o status.</p>
    <TrackOrderForm />
  </div>;
}
