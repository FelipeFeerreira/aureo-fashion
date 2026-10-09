import { lookupOrder } from "@/lib/orders/lookup";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { CheckoutError } from "@/lib/checkout/schema";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!await consumeLimit(requestLimitKey(request, "order-lookup"), 10)) {
      return privateJson({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
    }
    const order = await lookupOrder(JSON.parse(await readBody(request)));
    if (!order) return privateJson({ error: "Não encontramos um pedido com esses dados." }, 404);
    return privateJson({ order });
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Solicitação inválida." }, 400);
    return privateJson({ error: "Consulta indisponível. Tente novamente." }, 503);
  }
}
