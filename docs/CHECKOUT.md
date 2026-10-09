# Checkout AUREO

Veja o README para a configuração Stripe test. `/api/fashion/quote` e
`/api/fashion/checkout` recebem somente IDs/quantidades, cupom e dados do endereço.
Preço, composição da variante, estoque e desconto vêm do PostgreSQL. O total enviado
pelo navegador detecta mudança de preço e jamais define o valor cobrado.

A interface PaymentAdapter em `src/lib/fashion/payments.ts` só registra cartão de teste.
Não há Pix nem adapter live. O Stripe SDK verifica assinaturas no corpo bruto do webhook;
eventos live são recusados. Pedidos e IDs idempotentes são vinculados ao conteúdo da
requisição. Valores da compra, SKU, cor e tamanho ficam congelados em OrderItem.

A confirmação paga trava pedido e variantes em ordem estável; baixa todas ou nenhuma.
Conflitos viram PAYMENT_REVIEW. Duplicatas não repetem baixa. Retorno do navegador não
altera o status. Sem reserva durante o checkout: implementar reservas/reembolso antes
 de operar com dinheiro real. Cupom é calculado e distribuído em centavos nos snapshots;
não existe limite por cliente/quantidade de usos nesta versão.

Frete de teste é zero, explicitamente identificado. Cotação real por CEP aguarda
transportadora. CEP/UF têm validação sintática, não comprovam existência de endereço.

Teste manual após fornecer chaves: iniciar compra com endereço brasileiro fictício,
usar cartão Stripe de teste, verificar webhook, conferir pedido com número/e-mail,
reenviar evento e garantir que estoque não cai duas vezes. A suíte automatizada não
executa uma compra hospedada nem aciona serviços pagos.
