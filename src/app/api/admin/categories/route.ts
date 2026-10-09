import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner, mediaUrl } from "@/lib/fashion/admin";
import { privateJson, readBody } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
export async function POST(req: Request) {
  try {
    await requireOwner(req);
    const p = z
      .object({
        id: z.string().optional(),
        name: z.string().min(2).max(80),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        imageUrl: mediaUrl,
        sortOrder: z.number().int().min(0),
      })
      .parse(JSON.parse(await readBody(req)));
    const { id, ...data } = p;
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
    return privateJson({ message: "Categoria salva." });
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError
            ? e.message
            : "Revise os dados da categoria.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
