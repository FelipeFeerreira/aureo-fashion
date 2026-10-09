import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { grindLabels, type Grind } from "@/lib/cart/schema";

export async function sendOrderEmail(orderId: string) {
  // Serialize email delivery separately from payment/stock. A delivery failure never undoes payment.
  // Resend's idempotency key also covers a process crash between send and emailSentAt.
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (!order.paidAt || !order.email || order.emailSentAt) return;
    const review = order.status === "PAYMENT_REVIEW";
    const subject = `${review ? "Pagamento recebido — pedido em revisão" : "Pedido de teste confirmado"}: ${order.number}`;
    const text = [
      (await tx.storeSettings.findUnique({where:{id:"store"}}))?.name ?? "AUREO", "",
      "Loja demonstrativa: compra de teste. Nenhum pedido real será enviado.", "",
      review ? "Pagamento de teste recebido. O estoque mudou durante o checkout e o pedido precisa de revisão. Não pague novamente."
        : "Seu pagamento de teste foi confirmado.",
      `Pedido: ${order.number}`, "",
      ...order.items.map((item) => `${item.quantity} x ${item.name}${item.size ? ` (${item.color} / ${item.size})` : ""}${item.grind ? ` (${grindLabels[item.grind as Grind]})` : ""} — ${formatPrice(item.unitPriceCents * item.quantity)}`),
      "", `Subtotal: ${formatPrice(order.subtotalCents)}`, `Frete de teste: ${formatPrice(order.shippingCents)}`,
      `Total: ${formatPrice(order.totalCents)}`, "",
      `Acompanhe seu pedido: ${order.checkoutOrigin}/track-order`,
      "Informe o número do pedido e o e-mail usado no checkout.",
      "Atendimento humano ainda não configurado.",
    ].join("\n");
    if (!process.env.RESEND_API_KEY) {
      console.info("[email:local-preview]", { to: order.email, subject, text });
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AUREO <onboarding@resend.dev>",
        to: order.email, subject, text,
      }, { idempotencyKey: `order-confirmation-${order.id}` });
      if (error) throw new Error("Confirmation email delivery failed.");
    }
    await tx.order.update({ where: { id: order.id }, data: { emailSentAt: new Date() } });
  }, { timeout: 15_000 });
}
