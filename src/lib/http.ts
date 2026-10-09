import "server-only";
import { CheckoutError } from "@/lib/checkout/schema";

export async function readBody(request: Request, maxBytes = 16_384) {
  const reader=request.body?.getReader();
  if(!reader)return "";
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new CheckoutError("Solicitação muito grande.",413);}chunks.push(value);}
  return Buffer.concat(chunks).toString("utf8");
}

export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const target = new URL(request.url).origin;
  if (origin === target) return;
  // Same-origin fetch may not send an Origin header; fall back to Referer.
  const referer = request.headers.get("referer");
  if (!origin && referer) {
    try {
      if (new URL(referer).origin === target) return;
    } catch { /* malformed referer */ }
  }
  throw new CheckoutError("Please submit this request from the store.", 403);
}
