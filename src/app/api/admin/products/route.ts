import { db } from "@/lib/db";
import { requireOwner, productEdit } from "@/lib/fashion/admin";
import { privateJson, readBody } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
export async function POST(req: Request) {
  try {
    await requireOwner(req);
    const p = productEdit.parse(JSON.parse(await readBody(req, 128000)));
    const { id, variants, images, ...fields } = p;
    const result = await db.$transaction(async (tx) => {
      const data = {
        ...fields,
        saleStartsAt: fields.saleStartsAt
          ? new Date(fields.saleStartsAt)
          : null,
        saleEndsAt: fields.saleEndsAt ? new Date(fields.saleEndsAt) : null,
        imageUrl: images[0]?.url ?? "/images/tee.jpg",
        imageAlt: images[0]?.alt ?? p.name,
      };
      const product = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({
            data: {
              ...data,
              type: "ACCESSORY",
              stock: 0,
              tastingNotes: [],
              brewMethods: [],
            },
          });
      // Retire omitted variants: never delete a variant referenced by historical orders.
      await tx.productVariant.updateMany({
        where: { productId: product.id },
        data: { active: false },
      });
      for (const v of variants) {
        if (v.id) {
          const owned = await tx.productVariant.findFirst({
            where: { id: v.id, productId: product.id },
          });
          if (!owned) throw new Error("Invalid variant owner");
          await tx.productVariant.update({
            where: { id: v.id },
            data: { ...v, active: true },
          });
        } else
          await tx.productVariant.upsert({
            where: {
              productId_size_color: {
                productId: product.id,
                size: v.size,
                color: v.color,
              },
            },
            create: { ...v, productId: product.id, active: true },
            update: { ...v, active: true },
          });
      }
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.productImage.createMany({
        data: images.map((img, position) => ({
          ...img,
          position,
          productId: product.id,
        })),
      });
      return product;
    });
    return privateJson({ id: result.id, message: "Produto salvo." });
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError
            ? e.message
            : "Não foi possível salvar. Verifique os campos, o SKU e o endereço do produto.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
