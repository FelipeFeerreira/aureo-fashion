import "server-only";
import { getStripe, checkoutConfigured } from "@/lib/checkout/stripe";
export type PaymentMethod = "card" | "pix";
export type PaymentOrder = {
  id: string;
  email: string | null;
  checkoutOrigin: string;
  createdAt: Date;
  stripeSessionId: string | null;
  items: {
    quantity: number;
    unitPriceCents: number;
    name: string;
    color: string | null;
    size: string | null;
  }[];
};
export type PaymentSession = {
  id: string;
  url: string | null;
  open: boolean;
  live: boolean;
};
/** A future Brazilian provider must supply its own signed webhook handler and settlement tests.
 * No production adapter is registered; Pix cannot be selected until one is implemented. */
export interface PaymentAdapter {
  mode: "test" | "live";
  methods: PaymentMethod[];
  configured(): boolean;
  start(order: PaymentOrder): Promise<PaymentSession>;
}
export const paymentAdapter: PaymentAdapter = {
  mode: "test",
  methods: ["card"],
  configured: checkoutConfigured,
  async start(order) {
    const stripe = getStripe();
    const session = order.stripeSessionId
      ? await stripe.checkout.sessions.retrieve(order.stripeSessionId)
      : await stripe.checkout.sessions.create(
          {
            mode: "payment",
            payment_method_types: ["card"],
            locale: "pt-BR",
            customer_email: order.email!,
            client_reference_id: order.id,
            metadata: { orderId: order.id },
            success_url: `${order.checkoutOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${order.checkoutOrigin}/cart`,
            shipping_address_collection: { allowed_countries: ["BR"] },
            line_items: order.items.map((l) => ({
              quantity: l.quantity,
              price_data: {
                currency: "brl",
                unit_amount: l.unitPriceCents,
                product_data: {
                  name: `[TESTE] ${l.name} — ${l.color} / ${l.size}`,
                },
              },
            })),
            expires_at: Math.floor(order.createdAt.getTime() / 1000) + 3600,
          },
          { idempotencyKey: `fashion-${order.id}` },
        );
    return {
      id: session.id,
      url: session.url,
      open: session.status === "open",
      live: session.livemode,
    };
  },
};
