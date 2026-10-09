# Verificação AUREO

Verificado em Ubuntu em 09/10/2026 com Node 24.21.0, npm 11.19.0,
PostgreSQL 17 em Docker Engine e Chromium Playwright.

## Comandos

```bash
npm ci
npm run db:up
npx prisma migrate deploy
npm run db:seed
npm run admin:token
npm test
npm run test:integration
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

O runner de integração exige hostname local e banco terminado em `_test`, aplica
migrations e usa credenciais de teste fictícias. Não toca o banco de desenvolvimento.
A suíte E2E usa a loja local na porta 3200 e dados demonstrativos. O teste administrativo
altera uma frase e a ordem das imagens, verifica persistência e restaura o estado.
Não habilita traces, vídeos nem screenshots com a chave do proprietário.

## Cobertura

- **Unitários:** schemas, limites, precificação, armazenamento da sacola herdada,
  ações de atendimento, privacidade do assistente, injeção de instruções e saída
  inventada do modelo. Os testes de segurança da fundação continuam ativos.
- **Integração:** PostgreSQL real, autenticação, expiração/revogação, mesma origem,
  limites distribuídos, variantes inexistentes/incompatíveis/sem estoque, duplicatas,
  promoções, cupons, CEP/UF, consentimento e cancelamento de newsletter, reativação de
  variante sem mudança de ID, sessões isoladas e cota de IA.
- **Pagamentos:** valores e moeda verificados, snapshots BRL, assinatura Stripe real,
  rollback, idempotência, concorrência e último estoque, revisão por falta de estoque,
  lookup privado e tentativas com preço adulterado. O provedor externo é mockado.
- **Mídia:** autenticação obrigatória, storage desconfigurado, rejeição de SVG e bytes
  inválidos, decodificação real por Sharp, WebP e assinatura server-side. A resposta
  Cloudinary é mockada; nenhuma credencial externa é usada.
- **Browser:** navegação real, URL de filtros, estados vazios, cor/tamanho, combinação
  indisponível, sacola drawer, persistência após reload, quantidades, cupom, favoritos,
  bloqueio de checkout desconfigurado, mobile sem overflow, edição de produto e
  persistência da ordem/capa de fotos. Desktop e Pixel 7.

A duplicata mobile do teste de edição administrativa é intencionalmente omitida para
não disputar a mesma peça durante o teste desktop. A operação de upload no E2E é
interceptada; os bytes e assinatura são cobertos na integração. Os antigos testes da
interface de café ficam em `tests/foundation-e2e` como referência histórica e não são
contabilizados na suíte AUREO.

## Limites da evidência

Nenhum pagamento hospedado, entrega, e-mail, chamada Anthropic ou upload em conta
Cloudinary real foi realizado. Esses testes de ativação exigem credenciais da marca.
Lighthouse local é uma medição de laboratório da homepage, não garantia de desempenho
em hospedagem pública, todos os dispositivos ou todo o catálogo. Capturas de tela não
representam vendas ou mercadorias reais. Contagens de testes não são cobertura de 100%.

O build, TypeScript e ESLint foram verificados. A auditoria de dependências de produção
não encontrou vulnerabilidades; a árvore completa ainda tem 9 advisories de alta
severidade ligados a ferramentas de desenvolvimento glob/braces. O downgrade destrutivo
sugerido por `npm audit --force` não foi aplicado. Reavalie ao atualizar dependências.

## Resultado final registrado

- 63 testes unitários aprovados.
- 63 testes de integração aprovados, em PostgreSQL real.
- 7 testes de navegador aprovados; 1 duplicata mobile de edição administrativa omitida.
- TypeScript, ESLint, build de produção e `git diff --check` aprovados.
- Auditoria de dependências de produção: 0 vulnerabilidades.
- Lighthouse mobile, homepage no build de produção local: **91 performance,
  100 acessibilidade, 100 boas práticas e 100 SEO**. LCP 3,3 s, TBT 150 ms e CLS 0.
  A pontuação de performance variou entre execuções locais; os números acima são da
  última medição, com o bundle reduzido e sem testes de navegador simultâneos.

Dados resumidos: [verification.json](verification.json). Essas pontuações não substituem
avaliação manual nem medição na hospedagem final.
