import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Checkout pausado", robots: { index: false } };

export default function CheckoutCancelPage() {
  return <div className="mx-auto max-w-xl px-4 py-20 text-center">
    <p className="text-sm font-semibold tracking-widest text-ember uppercase">NO SEU TEMPO</p>
    <h1 className="mt-4 text-4xl font-semibold">Sua sacola está salva</h1>
    <p className="mt-5 text-muted-foreground">Você saiu do checkout. Revise sua sacola quando quiser. Se já pagou, consulte o pedido antes de tentar novamente.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Button asChild size="lg"><Link href="/cart">Voltar à sacola</Link></Button>
      <Button asChild variant="outline" size="lg"><Link href="/track-order">Acompanhe seu pedido</Link></Button>
    </div>
  </div>;
}
