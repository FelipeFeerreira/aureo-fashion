import type { Metadata } from "next";
import Link from "next/link";
import { Confirmation } from "@/components/checkout/confirmation";

export const metadata: Metadata = { title: "Confirmação do pedido", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const { session_id: sessionId } = await searchParams;
  return <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
    <p className="text-xs font-semibold tracking-widest text-primary uppercase">OBRIGADO PELA VISITA</p>
    <h1 className="mt-3 mb-8 text-4xl font-semibold">Seu pedido</h1>
    {typeof sessionId === "string" && /^cs_test_[a-zA-Z0-9_]{10,240}$/.test(sessionId)
      ? <Confirmation sessionId={sessionId} />
      : <p>Nenhuma sessão de checkout informada. <Link className="underline" href="/track-order">Acompanhe seu pedido com o número do pedido e e-mail.</Link></p>}
  </div>;
}
