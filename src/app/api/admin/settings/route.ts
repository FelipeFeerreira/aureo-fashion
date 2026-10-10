import { editorialSchema } from "@/lib/fashion/editorial";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner, mediaUrl } from "@/lib/fashion/admin";
import { privateJson, readBody } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
const schema = z.object({
  editorial: editorialSchema.optional(),
  name: z.string().min(1).max(40),
  slogan: z.string().max(150),
  announcement: z.string().max(200),
  heroTitle: z.string().max(150),
  heroImage: mediaUrl,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  privacyDraft: z.string().max(10000),
  shippingDraft: z.string().max(10000),
  returnsDraft: z.string().max(10000),
  termsDraft: z.string().max(10000),
});
export async function POST(req: Request) {
  try {
    await requireOwner(req);
    const data = schema.parse(JSON.parse(await readBody(req, 64000)));
    if (data.editorial) {
      const e = data.editorial;
      [e.logo, e.campaignImage, ...e.collections.map((c) => c.image)]
        .filter(Boolean)
        .forEach((url) => mediaUrl.parse(url));
      const ids = [...new Set(e.collections.flatMap((c) => c.productIds))];
      const count = await db.product.count({
        where: { id: { in: ids }, archived: false, categoryId: { not: null } },
      });
      if (count !== ids.length) throw new Error("Invalid product association");
    }
    await db.storeSettings.upsert({
      where: { id: "store" },
      create: data,
      update: data,
    });
    return privateJson({ message: "Configurações salvas." });
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError ? e.message : "Revise as configurações.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
