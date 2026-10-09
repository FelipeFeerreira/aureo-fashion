import { conversationMessages, createConversation, currentConversation } from "@/lib/chat/session";
import { MAX_CHAT_MESSAGES } from "@/lib/chat/constants";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { privateJson, requireSameOrigin } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    let conversation = await currentConversation(request);
    let cookie: string | undefined;
    if (!conversation) {
      if (!await consumeLimit(requestLimitKey(request, "chat-session"), 10, 3600)) return privateJson({ error: "Aguarde antes de abrir uma nova conversa." }, 429);
      const created = await createConversation(); conversation = created.conversation; cookie = created.cookie;
    }
    const response = privateJson({ messages: await conversationMessages(conversation.id), remaining: MAX_CHAT_MESSAGES - conversation.messageCount,
      available: !!process.env.ANTHROPIC_API_KEY });
    if (cookie) response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Não foi possível abrir a conversa. Tente novamente." }, 503);
  }
}
