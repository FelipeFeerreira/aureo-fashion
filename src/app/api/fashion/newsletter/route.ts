import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { CheckoutError } from "@/lib/checkout/schema";
const COOKIE = "aureo-newsletter";
function cookie(value: string, maxAge = 31_536_000) {
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api/fashion/newsletter; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    if (!(await consumeLimit(requestLimitKey(req, "newsletter"), 5)))
      return privateJson({ error: "Aguarde antes de tentar novamente." }, 429);
    const data = z
      .object({ email: z.email().max(254), consent: z.literal(true) })
      .parse(JSON.parse(await readBody(req, 2048)));
    const token = randomUUID();
    const subscriber = await db.newsletterSubscriber.upsert({
      where: { email: data.email.toLowerCase() },
      create: {
        email: data.email.toLowerCase(),
        consentVersion: "newsletter-v1",
        unsubscribeToken: token,
      },
      update: {},
      select: { unsubscribeToken: true },
    });
    const response = privateJson({
      message:
        "Interesse registrado. Nenhum e-mail promocional será enviado enquanto a loja estiver em demonstração.",
    });
    // Never disclose an existing subscriber's cancellation credential to someone who knows their email.
    if (subscriber.unsubscribeToken === token)
      response.headers.set("Set-Cookie", cookie(token));
    return response;
  } catch (error) {
    return privateJson(
      {
        error:
          error instanceof CheckoutError
            ? error.message
            : "Informe um e-mail válido e aceite receber novidades.",
      },
      error instanceof CheckoutError ? error.status : 400,
    );
  }
}
export async function DELETE(req: Request) {
  try {
    requireSameOrigin(req);
    const token = req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    if (token && z.uuid().safeParse(token).success)
      await db.newsletterSubscriber.deleteMany({
        where: { unsubscribeToken: token },
      });
    const response = privateJson({
      message:
        "A inscrição vinculada a este navegador foi cancelada. Nenhum novo e-mail será enviado.",
    });
    response.headers.set("Set-Cookie", cookie("", 0));
    return response;
  } catch (error) {
    return privateJson(
      {
        error:
          error instanceof CheckoutError
            ? error.message
            : "Não foi possível cancelar. Tente novamente.",
      },
      error instanceof CheckoutError ? error.status : 503,
    );
  }
}
