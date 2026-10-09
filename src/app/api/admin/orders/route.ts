import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/fashion/admin";
import { privateJson, readBody } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
export async function POST(req: Request) {
  try {
    await requireOwner(req);
    const p = z
      .object({
        id: z.string(),
        status: z.enum(["SHIPPED", "DELIVERED"]),
        trackingNumber: z.string().trim().min(3).max(100),
      })
      .parse(JSON.parse(await readBody(req)));
    const result = await db.order.updateMany({
      where: { id: p.id, status: p.status === "SHIPPED" ? "PAID" : "SHIPPED" },
      data: { status: p.status, trackingNumber: p.trackingNumber },
    });
    if (!result.count)
      throw new CheckoutError(
        "Transição inválida ou pedido alterado. Atualize a página.",
      );
    return privateJson({ message: "Pedido atualizado." });
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError ? e.message : "Revise os dados do pedido.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
