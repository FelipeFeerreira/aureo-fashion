"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { useFashionCart, saveBag } from "./store";
type Quote = {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  shippingLabel: string;
};
export function Bag({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const items = useFashionCart(),
    [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(""),
    [coupon, setCoupon] = useState(""),
    [applied, setApplied] = useState(""),
    [busy, setBusy] = useState(false),
    [key] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let cancelled = false;
    fetch("/api/fashion/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, coupon: applied }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!cancelled) {
          setQuote(r.ok ? data : null);
          setError(r.ok ? "" : data.error);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuote(null);
          setError("Não foi possível atualizar os preços. Tente novamente.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [items, applied]);
  async function checkout(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/fashion/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          coupon: applied,
          checkoutKey: key,
          expectedTotalCents: quote?.totalCents,
          address: Object.fromEntries(form),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      try {
        sessionStorage.setItem(
          "aureo-checkout",
          JSON.stringify({ sessionId: data.sessionId, items }),
        );
      } catch {}
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no checkout.");
      setBusy(false);
    }
  }
  if (!items.length)
    return (
      <div className="empty">
        <h2>Espaço para novos essenciais.</h2>
        <p>Sua sacola ainda está vazia.</p>
        <Link onClick={onNavigate} className="button" href="/shop">
          Explorar coleção <ArrowRight size={17} />
        </Link>
      </div>
    );
  return (
    <div className={compact ? "bag-content" : "cart-layout"}>
      <div>
        {items.map((item) => (
          <article className="bag-line" key={item.variantId}>
            <Link onClick={onNavigate} href={`/shop/${item.slug}`}>
              <Image
                src={item.image || "/images/tee.jpg"}
                alt={item.name}
                width={110}
                height={140}
              />
            </Link>
            <div>
              <Link onClick={onNavigate} href={`/shop/${item.slug}`}>
                <h3>{item.name}</h3>
              </Link>
              <p>
                {item.color} / {item.size}
              </p>
              <div className="quantity">
                <button
                  aria-label={`Diminuir ${item.name}`}
                  onClick={() =>
                    saveBag(
                      items.flatMap((x) =>
                        x.variantId === item.variantId
                          ? x.quantity > 1
                            ? [{ ...x, quantity: x.quantity - 1 }]
                            : []
                          : [x],
                      ),
                    )
                  }
                >
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button
                  aria-label={`Aumentar ${item.name}`}
                  disabled={item.quantity >= 10}
                  onClick={() =>
                    saveBag(
                      items.map((x) =>
                        x.variantId === item.variantId
                          ? { ...x, quantity: x.quantity + 1 }
                          : x,
                      ),
                    )
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button
              className="icon"
              aria-label={`Remover ${item.name}`}
              onClick={() =>
                saveBag(items.filter((x) => x.variantId !== item.variantId))
              }
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>
      <div className="order-summary">
        <h2>Resumo da sacola</h2>
        <form
          className="coupon"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(coupon.trim().toUpperCase());
          }}
        >
          <label htmlFor={compact ? "coupon-drawer" : "coupon"}>Cupom</label>
          <div>
            <input
              id={compact ? "coupon-drawer" : "coupon"}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Seu código"
            />
            <button>Aplicar</button>
          </div>
        </form>
        {quote && (
          <>
            <p>
              <span>Subtotal</span>
              {formatMoney(quote.subtotalCents)}
            </p>
            {quote.discountCents > 0 && (
              <p>
                <span>Desconto</span>− {formatMoney(quote.discountCents)}
              </p>
            )}
            <p className="total">
              <span>Total de teste</span>
              {formatMoney(quote.totalCents)}
            </p>
            <small>{quote.shippingLabel}</small>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {compact ? (
          <Link onClick={onNavigate} className="button" href="/cart">
            Revisar sacola <ArrowRight size={17} />
          </Link>
        ) : (
          <form action={checkout} className="address">
            <h3>Dados para o checkout de teste</h3>
            <p>Use dados fictícios. Pagamentos reais estão desativados.</p>
            {[
              ["name", "Nome completo"],
              ["email", "E-mail"],
              ["cep", "CEP"],
              ["street", "Rua"],
              ["number", "Número"],
              ["city", "Cidade"],
              ["state", "UF"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  required
                  type={name === "email" ? "email" : "text"}
                  maxLength={name === "state" ? 2 : name === "cep" ? 9 : 150}
                  pattern={
                    name === "cep"
                      ? "[0-9]{5}-?[0-9]{3}"
                      : name === "state"
                        ? "[A-Z]{2}"
                        : undefined
                  }
                />
              </label>
            ))}
            <button className="button" disabled={busy || !quote}>
              {busy ? "Validando…" : "Ir ao pagamento de teste"}
              <ArrowRight size={17} />
            </button>
            <small>
              Cartão em ambiente de teste. Pix e pagamentos reais aguardam
              integração e validação.
            </small>
          </form>
        )}
      </div>
    </div>
  );
}
export function Newsletter({
  title = "Faça parte do próximo capítulo.",
  description = "Novas coleções e histórias da marca.",
}: {
  title?: string;
  description?: string;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">FAÇA PARTE DO NOSSO UNIVERSO</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/fashion/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: f.get("email"),
                consent: f.get("consent") === "on",
              }),
            });
            const d = await r.json();
            setMessage(d.message ?? d.error);
          } catch {
            setMessage("Não foi possível registrar. Tente novamente.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="newsletter-input">
          <label className="sr-only" htmlFor="newsletter-email">
            Seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            placeholder="Seu melhor e-mail"
          />
          <button aria-label="Inscrever-se" disabled={busy}>
            <ArrowRight size={23} />
          </button>
        </div>
        <label className="consent">
          <input type="checkbox" name="consent" required /> Quero receber
          novidades e li o rascunho de{" "}
          <Link href="/policies/privacy">privacidade</Link>. Posso cancelar o
          consentimento.
        </label>
        <p role="status">{message}</p>
        <button
          type="button"
          className="newsletter-cancel"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const response = await fetch("/api/fashion/newsletter", {
                method: "DELETE",
              });
              const data = await response.json();
              setMessage(data.message ?? data.error);
            } catch {
              setMessage("Não foi possível cancelar. Tente novamente.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Cancelar inscrição deste navegador
        </button>
      </form>
    </section>
  );
}
