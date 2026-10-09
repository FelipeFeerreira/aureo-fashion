import "server-only";
import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { effectivePrice } from "@/lib/fashion/catalog";
import { db } from "@/lib/db";
import { lookupOrder } from "@/lib/orders/lookup";
import { productSearchSchema, productIdSchema, orderToolSchema, type ChatReply } from "./schema";
import { knowledge, safeReplies } from "./knowledge";

export const chatProductSelect = {
  id: true, name: true, slug: true, type: true, priceCents: true, stock: true,
  imageUrl: true, imageAlt: true, tastingNotes: true, tagline: true,
  salePriceCents:true, saleStartsAt:true,saleEndsAt:true,archived:true,categoryId:true,composition:true,fit:true,variants:{where:{active:true},select:{size:true,color:true,stock:true}},
} as const;
const knowledgeSchema = z.object({ id: z.enum(knowledge.map((entry) => entry.id) as [string, ...string[]]) }).strict();
const replySchema = z.object({ kind: z.enum(["greeting", "clarify", "off_topic", "handoff", "order_details"]) }).strict();
function tool(name: string, description: string, schema: z.ZodObject): Tool {
  return { name, description, input_schema: { ...z.toJSONSchema(schema), type: "object" } };
}
export const chatTools: Tool[] = [
  tool("search_products", "Find up to three in-stock products by preferences. Prices and stock come from the database. Use query only for a specific product name; omit it for broad preferences.", productSearchSchema),
  tool("get_product", "Show a known product ID from previous tool results. Never invent an ID.", productIdSchema),
  tool("get_order_status", "Read a private order status. Both order_number and email MUST appear together in the customer's current message; never guess or reuse credentials from history.", orderToolSchema),
  tool("answer_store_question", "Answer using one verified policy or FAQ entry ID from the system knowledge. Do not invent policy terms.", knowledgeSchema),
  tool("respond", "Choose a greeting, preference clarification, polite off-topic refusal, human handoff, or request for order credentials. Use handoff for unsupported store questions or explicit human requests.", replySchema),
];

export async function executeChatTool(name: string, input: unknown, currentMessage: string): Promise<ChatReply> {
  switch (name) {
    case "search_products": {
      const filter = productSearchSchema.parse(input);
      const products = await db.product.findMany({
        where: {
          archived: false, categoryId: {not: null},
          variants: {some: {active:true, stock:{gt:0}, ...(filter.size?{size:filter.size}:{}), ...(filter.color?{color:filter.color}:{})}},
          ...(filter.category ? {category:{slug:filter.category}} : {}),
          ...(filter.maxPriceCents !== undefined && { priceCents: { lte: filter.maxPriceCents } }),
          ...(filter.query && { name: { contains: filter.query, mode: "insensitive" } }),
        }, select: chatProductSelect, take: 3, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
      });
      return { topic: "products", products:products.map(p=>({...p,priceCents:effectivePrice(p),stock:p.variants.reduce((n,v)=>n+v.stock,0)})), text: products.length
        ? "Estas peças combinam com a sua busca. Abra a peça para conferir cores, tamanhos, composição e medidas. Os preços vêm do catálogo."
        : "Não encontrei peças disponíveis com essas preferências. Tente outro tamanho, cor ou orçamento.", handoff: !products.length };
    }
    case "get_product": {
      const { id } = productIdSchema.parse(input);
      const product = await db.product.findFirst({ where: { id,archived:false,categoryId:{not:null} }, select: chatProductSelect });
      return { topic: "product-detail", products: product ? [{...product,priceCents:effectivePrice(product),stock:product.variants.reduce((n,v)=>n+v.stock,0)}] : [], text: product
        ? `Composição: ${product.composition} Modelagem: ${product.fit} Disponibilidade: ${product.variants.filter(v=>v.stock>0).map(v=>`${v.color} / ${v.size}`).join(", ")||"Sem estoque"}. Confira o guia de medidas na página da peça.`
        : "Esta peça não está disponível no catálogo. Vamos procurar outra opção.", handoff: !product };
    }
    case "get_order_status": {
      const { order_number, email } = orderToolSchema.parse(input);
      const suppliedOrders: string[] = currentMessage.toUpperCase().match(/\bEO-[A-F0-9]{16}\b/g) ?? [];
      const suppliedEmails: string[] = currentMessage.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? [];
      if (!suppliedOrders.includes(order_number) || !suppliedEmails.includes(email)) {
        return { topic: "order-credentials", text: safeReplies.order_details };
      }
      const order = await lookupOrder({ orderNumber: order_number, email });
      return order ? { topic: "order-status", text: "Este é o status registrado para seu pedido de teste. Não há envio real.",
        order: { number: order.number, status: order.status, totalCents: order.totalCents, trackingNumber: order.trackingNumber } }
        : { topic: "order-not-found", text: "Não encontrei um pedido com esses dados. Confira o número e o e-mail do checkout.", handoff: true };
    }
    case "answer_store_question": {
      const { id } = knowledgeSchema.parse(input);
      const entry = knowledge.find((item) => item.id === id)!;
      return { topic: id, text: entry.answer };
    }
    case "respond": {
      const { kind } = replySchema.parse(input);
      return { topic: kind, text: safeReplies[kind], handoff: kind === "handoff" };
    }
    default: throw new Error("Unknown chat tool.");
  }
}
