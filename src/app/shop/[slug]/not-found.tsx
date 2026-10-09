import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">Peça não encontrada</h1>
      <p className="mt-4 text-muted-foreground">
        Esta peça não está no catálogo. Explore a coleção atual.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/shop">Explorar coleção</Link>
      </Button>
    </div>
  );
}
