"use client";
import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import type { ChatViewMessage } from "@/lib/chat/schema";
export function Assistant() {
  const [open, setOpen] = useState(false),
    [messages, setMessages] = useState<ChatViewMessage[]>([]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function launch() {
    setOpen(true);
    try {
      const r = await fetch("/api/chat/session", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw Error();
      setMessages(d.messages);
    } catch {
      setError("Assistente indisponível. Tente novamente.");
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const question = text;
    setText("");
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "USER", text: question },
    ]);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          requestId: crypto.randomUUID(),
        }),
      });
      if (!r.ok) throw Error((await r.json()).error);
      const events = (await r.text())
        .trim()
        .split("\n")
        .map((x) => JSON.parse(x));
      const result = events.find((x) => x.type === "result");
      if (!result) throw Error("Não foi possível responder.");
      setMessages((m) => [...m, result.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na conexão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="assistant" onClick={() => void launch()}>
        Ajuda para escolher ↗
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Seu assistente de estilo</DialogTitle>
          <p className="muted">
            Quando ativo, suas mensagens são processadas pela Anthropic. Não
            envie dados sensíveis. Histórico limitado a esta sessão.
          </p>
          <div className="chat-log" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id}>
                <p>
                  <strong>{m.role === "USER" ? "Você" : "Assistente"}: </strong>
                  {m.text}
                </p>
                {m.products?.map((p) => (
                  <p key={p.id}>
                    <Link
                      href={`/shop/${p.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      {p.name} · {formatMoney(p.priceCents)} → Ver tamanhos
                    </Link>
                  </p>
                ))}
                {m.order && (
                  <p>
                    {m.order.number} · {m.order.status} ·{" "}
                    {formatMoney(m.order.totalCents)}
                  </p>
                )}
              </div>
            ))}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={send} style={{ display: "flex", gap: 10 }}>
            <label className="sr-only" htmlFor="style-message">
              Sua mensagem
            </label>
            <input
              style={{ minWidth: 0, flex: 1 }}
              id="style-message"
              value={text}
              maxLength={1000}
              required
              onChange={(e) => setText(e.target.value)}
              placeholder="Uma camiseta M até R$ 200…"
            />
            <button className="button" disabled={busy}>
              {busy ? "…" : "Enviar"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
