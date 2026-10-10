"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-md px-6 py-24 text-center"><h1 className="text-3xl font-semibold">Painel indisponível</h1><p className="mt-4 text-muted-foreground">Não foi possível carregar o painel. Tente novamente.</p><button onClick={reset} className="mt-6 rounded-lg bg-primary px-5 py-3 text-primary-foreground">Tentar novamente</button></div>;
}
