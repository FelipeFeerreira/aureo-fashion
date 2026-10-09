import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { bagSchema, quoteBag } from "@/lib/fashion/commerce";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    if (!(await consumeLimit(requestLimitKey(req, "fashion-quote"), 120)))
      return privateJson(
        { error: "Aguarde antes de atualizar a sacola novamente." },
        429,
      );
    const input = bagSchema.parse(JSON.parse(await readBody(req)));
    return privateJson(await quoteBag(input));
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError
            ? e.message
            : "Não foi possível validar a sacola.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
