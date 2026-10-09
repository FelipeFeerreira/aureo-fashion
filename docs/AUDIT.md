# Auditoria de Ember & Oak → AUREO

A origem foi clonada para uma pasta independente `aureo`. O remoto foi renomeado para
`foundation`; nenhum arquivo do repositório original foi alterado.
`AGENTS.md` foi lido antes das alterações, assim como os guias locais de Next.js para
rotas e formulários. A fundação usa npm, Node 24, Next App Router, React 19, Tailwind 4,
Prisma 7/PostgreSQL, Zod, Radix/shadcn, Vitest e Playwright.

## Achados

- Product era centrado em café (torra, moagem, origem), com um estoque por produto.
- Sacola local validada, cotações server-side e checkout Stripe estritamente de teste.
- Snapshot de pedido, chave idempotente, confirmação por assinatura, transação de
  estoque, proteção contra eventos repetidos e estado de revisão por falta de estoque.
- Rastreamento com número/e-mail e seleção pública restrita, sem endereço ou IDs de pagamento.
- Admin com sessões opacas, hash no banco, SameSite/HttpOnly, expiração, rotação de chave,
  autorização no servidor, proteção same-origin e limites PostgreSQL por IP.
- Painel original focado em pedidos, conversas e leads; não existia CRUD de catálogo/mídia.
- Assistente com ferramentas Zod, sem prosa livre publicada, limite por sessão/IP/dia,
  uma chamada por turno, histórico limitado, lease no banco e credenciais de pedido
  obrigatórias na mensagem atual.
- Documentação e E2E eram inteiramente de café/inglês/USD e instruções incluíam Desktop.
- Dependências herdadas tinham advisories. Next atualizado de 16.3.6 para 16.4.0;
  demais correções compatíveis aplicadas. Auditoria de produção limpa. A árvore completa
  ainda contém advisories de ferramentas de desenvolvimento ligadas a glob/braces;
  não foi aplicado downgrade destrutivo sugerido por `npm audit --force`.

## Decisões

Migrations aditivas e modelos de variante/mídia/categoria/configurações/consentimento.
Estoque de moda somente em ProductVariant, não no campo legado. Rotas de moda
independentes reutilizam autenticação, limites, banco e confirmação de pagamento.
Rotas antigas de cotação não retornam produtos de moda, impedindo contornar variantes.
Campos antigos ficam por compatibilidade; sua remoção exige migração posterior.

Coleções e tags são atributos de Product; estoque é campo da variante; clientes são
projeção dos pedidos. Não foram criadas tabelas redundantes Customer/Inventory/Collection
sem necessidade operacional. Sacola e wishlist são locais ao navegador, com valores
sempre recalculados do banco. Banners vivem nas configurações persistentes da loja.

Next 16.4 é compatível com a arquitetura existente; Prisma permaneceu no 7.10 estável
em vez de migrar para uma versão candidata 8. Frontend reconstruído, sem copiar a
linguagem visual de café. Fotografias reais de referência do Unsplash, claramente
ilustrativas. A galeria está pronta para múltiplas fotos reais por cor.

AUREO usa cookies próprios (`aureo-owner`, `aureo-chat`, `aureo-newsletter`) para evitar
conflitos com a fundação quando ambas rodam em portas diferentes de localhost.
O fallback do runner de integração também aponta exclusivamente para `aureo_test:5440`.

A pedido do proprietário, a versão AUREO foi preparada para publicação em repositório
público separado: `FelipeFeerreira/aureo-fashion`. O histórico da fundação é preservado;
`.env.local`, segredos, dependências instaladas e artefatos de build não são versionados.
