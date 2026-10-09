import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner, mediaUrl } from "@/lib/fashion/admin";
import { privateJson, readBody } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
const schema = z.object({
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
