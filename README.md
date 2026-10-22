# AUREO — estúdio de essenciais

E-commerce brasileiro de moda, desenvolvido como projeto independente a partir de
[Ember & Oak](https://github.com/FelipeFeerreira/ember-oak-coffee).
Interface pt-BR, preços BRL, catálogo PostgreSQL, variantes de roupa e painel da marca.

[Prévia desktop](docs/screenshots/aureo/desktop.jpg) · [Prévia mobile](docs/screenshots/aureo/mobile.jpg) · [Verificação](docs/TESTING.md)

**Ambiente demonstrativo funcional, ainda não liberado para vendas reais.** As fotos,
medidas, composições, popularidade e estoques do seed são ilustrativos. Não há pedidos
ou faturamento inventados. O checkout aceita somente credenciais Stripe de teste e a
confirmação depende de webhook assinado. Pix não está habilitado.

## Ubuntu: começar

Requisitos verificados: Node **24.21.0**, npm **11.19.0**, Git **2.53.0**, Docker Engine
**29.1.3**, Docker Compose **2.40.3**. Use Node 24 (`.nvmrc`). Não é necessário Docker Desktop.

```bash
git clone https://github.com/FelipeFeerreira/aureo-fashion.git
cd aureo-fashion
# Se nvm estiver instalado:
nvm use
npm ci
cp .env.example .env.local  # SOMENTE na instalação inicial; não sobrescreva suas credenciais
chmod 600 .env.local
npm run db:up
npx prisma migrate deploy
npm run db:seed
npm run admin:token
npm run dev
```

Loja: **http://localhost:3200**. Administração: **http://localhost:3200/admin**.
A chave privada de administração está em `.env.local`, gerada por `admin:token`.
Abra esse arquivo localmente para utilizá-la. Ela nunca é enviada como URL ou incluída
no JavaScript público. Alterá-la revoga as sessões existentes. Não publique esse arquivo.

O banco `aureo` usa `127.0.0.1:5440`, volume Docker `aureo_pgdata`; testes usam
`aureo_test` no mesmo contêiner. Isso não altera o banco nem o repositório original.
O repositório público é `FelipeFeerreira/aureo-fashion`, com branch principal `main`.
Nesta cópia de desenvolvimento, a branch local é `aureo`, o remoto de publicação é
`origin` e o remoto herdado `foundation` tem push desativado.

Se o Docker não responder, instale/ative Docker Engine e o plugin Compose para Ubuntu
conforme a documentação oficial da sua versão. Verifique `docker info` e permissões do
socket. Não execute `docker compose down -v` se quiser preservar o banco.

## Configuração

Copie apenas os valores necessários para `.env.local` ou para o gerenciador de segredos
da hospedagem. `.env.example` documenta as variáveis, sem credenciais externas.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL de runtime |
| `DIRECT_URL` | Conexão direta opcional para migrations |
| `TEST_DATABASE_URL` | Banco local terminado em `_test` |
| `ADMIN_TOKEN` | Chave de 32–256 caracteres, apenas servidor |
| `NEXT_PUBLIC_SITE_URL` | Origem HTTPS em produção; localhost permitido no desenvolvimento |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Exclusivamente Stripe test/sandbox e assinatura de webhook |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Armazenamento persistente de mídia |
| `ANTHROPIC_API_KEY` | Assistente opcional; manter vazia para não consumir API |
| `NEXT_PUBLIC_ASSISTANT_ENABLED` | `true` mostra o assistente discreto |
| `RESEND_API_KEY`, `RESEND_FROM` | Confirmações opcionais; sem chave, somente log local |
| `DEMO_MODE` | Manter `false`; rotina herdada de limpeza é destrutiva e restrita a demos |

A identidade e os rascunhos são editáveis em **Marca e conteúdo**. A marca padrão é
AUREO. Categorias vêm do banco. Cores e tamanhos vêm das variantes. As cores base e
espaçamento estão em `src/app/globals.css`; cor principal, hero e anúncio são editáveis.
O logotipo padrão é tipográfico e acompanha o nome configurado.

## Fluxos implementados

- Homepage editorial, coleção, novidades, destaques editoriais, categorias e newsletter.
- Catálogo paginado no banco (12 peças), busca, preço mínimo/máximo, cor, tamanho,
  disponibilidade e ordenação. Filtros em URLs compartilháveis.
- Produto com galeria por cor, zoom, medidas, composição, cuidados, variantes, SKU,
  indisponibilidade por combinação e relacionados. Sem fotos reais de frente/costas
  disponíveis: substitua as referências antes de publicar mercadoria.
- Favoritos e sacola persistidos neste navegador. Drawer, página de sacola, quantidades,
  cupom validado no servidor (`DEMO10` no seed) e endereço com CEP/UF validados.
- Preços de promoção respeitam início/fim; datas de promoção no painel são UTC.
- Checkout de teste em BRL, confirmação por webhook, rastreamento privado por número
  e e-mail, snapshots de SKU/cor/tamanho/preço e estoque atômico por variante.
- Admin autenticado: criar/editar/arquivar produtos, variantes, estoque, fotos, medidas,
  preços, categorias, conteúdo, pedidos, histórico de clientes e indicadores de teste.
- Upload autenticado, validação de formato/tamanho/pixels, remoção de metadados, WebP,
  previews, drag-and-drop, botões de ordenação acessíveis, capa e associação por cor.
- Assistente opcional com ferramentas de catálogo/estoque/medidas/pedidos, limites,
  sessões isoladas e nenhuma prosa livre do modelo publicada como fato comercial.
- Consentimento explícito e versionado da newsletter, com cancelamento pelo navegador que registrou a inscrição. Nenhuma campanha é enviada.
- SEO, sitemap, robots, dados estruturados, imagens responsivas, estados de erro/loading,
  diálogos com teclado e preferência de movimento reduzido.

## Banco e migrations

```bash
npx prisma generate
npx prisma migrate deploy      # aplicar migrations existentes
npx prisma migrate dev --name descricao_da_mudanca  # desenvolvimento de schema
npm run db:seed
```

O seed é idempotente, preserva produtos existentes e recusa `NODE_ENV=production`.
Usa `sample=true`. Não execute seed de demonstração num banco comercial.
Migrations são aditivas: mantêm campos antigos para compatibilidade com os testes e
infraestrutura herdados. `ProductVariant` é a autoridade de estoque da moda;
`Product.stock` não é usado para comprar roupas. Variantes retiradas são inativadas,
não apagadas quando fazem parte de pedidos. Arquivar preserva o histórico.
As constraints SQL impedem estoque negativo e promoções/cupons inválidos.

## Checkout e entrega

Leia [CHECKOUT.md](docs/CHECKOUT.md). Configure uma conta Stripe de **teste**, uma
chave `sk_test_...`, encaminhe o webhook com Stripe CLI e configure `whsec_...`:

```bash
stripe listen --events checkout.session.completed,checkout.session.expired \
  --forward-to localhost:3200/api/stripe/webhook
```

Somente o evento assinado confirma o pagamento; visitar a página de sucesso nunca o
confirma. A suíte simula o provedor, mas usa o SDK real para assinaturas e PostgreSQL
real para transações. O checkout hospedado real de teste precisa de suas credenciais.

`src/lib/fashion/payments.ts` é a interface de provedores. Atualmente só registra o
adaptador Stripe de teste/cartão. Integrar Pix exige um adaptador e eventos assíncronos
assinados próprios, validação do provedor e testes de conciliação. Não basta trocar uma
chave. Não existe adaptador de produção habilitado.

Frete real não está integrado. O CEP é validado; a página informa indisponibilidade.
O frete R$ 0,00 é **somente uma condição de teste**, não uma oferta comercial.
Estoque não é reservado durante o checkout: duas confirmações competindo pela última
unidade produzem um pedido `PAID` e outro `PAYMENT_REVIEW`, sem estoque negativo.
Antes de vender, implemente reservas com expiração ou um fluxo operacional de revisão
e reembolso. O painel não inventa confirmação de pagamento.

## Imagens persistentes

Leia [ADMIN.md](docs/ADMIN.md). Configure Cloudinary no servidor e reinicie o app.
Sem credenciais, o formulário explica que o upload está desativado. Não há fallback
para disco efêmero. Upload limitado a 5 MB, JPEG/PNG/WebP, 40 megapixels; Sharp decodifica,
remove metadados e limita a resolução. A entrega usa Next Image e domínio permitido.

Excluir uma imagem no produto a **desvincula**; o original fica na Cloudinary para
recuperação. Arquivos enviados e não salvos podem ficar órfãos: estabeleça uma rotina
administrativa de limpeza com período de retenção. Nenhuma exclusão remota automática
é feita neste projeto. Veja [créditos e limites das fotos](docs/PHOTOGRAPHY.md).

## Verificação

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --omit=dev
npm audit
```

Testes de integração se recusam a executar fora de um banco local `_test`.
E2E usa Chromium desktop e Pixel 7. O teste do proprietário exige `ADMIN_TOKEN` local;
traces e screenshots desse teste ficam desativados para não registrar credenciais.
Upload externo é interceptado no teste de UI: prova edição/ordenação/persistência,
não conectividade com uma conta Cloudinary. O pagamento externo também é mockado.
Testes antigos da interface de café estão preservados em `tests/foundation-e2e`, fora
da suíte AUREO. Testes de segurança e transações herdados continuam ativos.

## Build, operação e implantação

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Use Node 24, PostgreSQL persistente, backups testados, TLS e proxy confiável que
sobrescreva `x-forwarded-for`. Configure a origem pública real, segredos no servidor,
logs com retenção e limites de corpo no proxy. Nunca exponha o token da marca ou dados
pessoais em screenshots. Cookies de admin são Secure em produção: use HTTPS.

Antes do lançamento: dados/fotos reais e licenciados, políticas revisadas, contato e
identificação da empresa, transporte, pagamentos brasileiros com webhooks e segurança
validados, reserva/reembolso, verificação de e-mail para acesso a pedidos sensíveis,
processos LGPD e cancelamento de marketing, recuperação de acesso administrativo,
observabilidade, backups, testes do provedor real e revisão de carga/acessibilidade.
Clientes e relatórios no painel mostram os 100 pedidos mais recentes; os totais usam
o banco inteiro. Não há contas de clientes ou sincronização de favoritos entre aparelhos.
Nenhum deploy, cobrança real, domínio, conta externa ou e-mail foi criado/enviado.

[Auditoria da fundação](docs/AUDIT.md) · [Testes](docs/TESTING.md) ·
[Implantação](docs/DEPLOYMENT.md) · [Assistente](docs/CHAT.md).
Documentação antiga está preservada em `docs/foundation` para referência histórica.

---

## License

MIT - see [LICENSE](LICENSE). You may use, modify and redistribute this code with attribution.
