import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireOwner } from "@/lib/fashion/admin";
import { privateJson } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    await requireOwner(req);
    if (!(await consumeLimit(requestLimitKey(req, "media"), 30)))
      throw new CheckoutError("Limite de uploads atingido.", 429);
    const cloud = process.env.CLOUDINARY_CLOUD_NAME,
      key = process.env.CLOUDINARY_API_KEY,
      secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret)
      throw new CheckoutError(
        "Configure o armazenamento Cloudinary para enviar imagens persistentes.",
        503,
      );
    if (Number(req.headers.get("content-length")) > 6 * 1024 * 1024)
      throw new CheckoutError("Limite de 5 MB por imagem.", 413);
    const reader = req.body?.getReader();
    if (!reader) throw new CheckoutError("Arquivo ausente.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 6 * 1024 * 1024) {
        await reader.cancel();
        throw new CheckoutError("Limite de 5 MB por imagem.", 413);
      }
      chunks.push(value);
    }
    const bounded = new Request(req.url, {
      method: "POST",
      headers: { "content-type": req.headers.get("content-type") ?? "" },
      body: Buffer.concat(chunks),
    });
    const file = (await bounded.formData()).get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new CheckoutError("Envie JPG, PNG ou WebP de até 5 MB.", 400);
    const bytes = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40000000,
    })
      .rotate()
      .resize({
        width: 2400,
        height: 3000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer();
    const timestamp = String(Math.floor(Date.now() / 1000)),
      public_id = `aureo/${randomUUID()}`;
    const signature = createHash("sha1")
      .update(`public_id=${public_id}&timestamp=${timestamp}${secret}`)
      .digest("hex");
    const body = new FormData();
    body.set(
      "file",
      new Blob([new Uint8Array(bytes)], { type: "image/webp" }),
      "image.webp",
    );
    body.set("api_key", key);
    body.set("timestamp", timestamp);
    body.set("public_id", public_id);
    body.set("signature", signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(30000) },
    );
    if (!response.ok) throw Error("Storage failed");
    const result = await response.json();
    return privateJson({
      url: result.secure_url,
      storageKey: result.public_id,
      alt: file.name.replace(/\.[^.]+$/, ""),
    });
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof CheckoutError
            ? e.message
            : "Falha ao processar ou armazenar a imagem.",
      },
      e instanceof CheckoutError ? e.status : 400,
    );
  }
}
