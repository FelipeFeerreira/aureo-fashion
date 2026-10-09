import { faqs, policies } from "@/content/store-info";

export const knowledge = [
  ...policies.map((policy) => ({ id: `policy-${policy.id}`, question: policy.title, answer: policy.points.join("\n\n") })),
  ...faqs.map((faq, index) => ({ id: `faq-${index}`, question: faq.question, answer: faq.answer })),
];

export const safeReplies = {
 greeting: "Olá! Posso ajudar a encontrar peças, tamanhos e materiais. Que estilo você procura e qual é o seu orçamento?",
 clarify: "Você procura uma camiseta, moletom, calça ou jaqueta? Conte seu tamanho, cores preferidas e orçamento.",
 off_topic: "Posso ajudar com as peças, medidas, políticas e pedidos desta loja.",
 handoff: "Não tenho uma resposta verificada para isso. Consulte nossas dúvidas frequentes. O atendimento humano ainda não está ativo nesta demonstração.",
 order_details: "Envie o número do pedido (EO- e 16 caracteres) e o e-mail do checkout juntos nesta mensagem. Também é possível usar Acompanhe seu pedido.",
};

export function redactChatText(text: string) {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]");
}

export function obviousInstructionAttack(text: string) {
  return /ignore.{0,30}(previous|instructions|rules)|reveal.{0,30}(prompt|secret|key)|system\s*prompt|developer\s*message|\b(jailbreak|DAN mode)\b/i.test(text);
}
