# T Knights Mark — direção visual e entrega

## Auditoria e decisões

A aplicação existente permanece no mesmo repositório. Checkout, estoque por variante,
cookies de autenticação, pedidos, consentimento e armazenamento Cloudinary foram preservados.
A auditoria identificou duas raízes de tokens (café e AUREO), cores claras fixas,
texto de campanha no JSX, produtos repetidos na homepage e configuração editorial limitada.

O CSS agora tem uma única raiz semântica escura. As referências de classes de café foram
migradas também nos componentes herdados para não deixar dependências quebradas.
Cormorant Garamond é usada nos títulos; Manrope nas informações de compra. Fontes locais
WOFF2, com repertório latino e pontuação, licenças OFL na pasta `public/fonts`.
Nenhuma dependência da aplicação foi atualizada.

Emblema vetorial original e provisório: escudo linear, monograma configurável e wordmark.
O favicon usa a mesma linguagem. A assinatura ainda pode ser substituída após aprovação criativa.

## Conteúdo administrável

Em **Admin → Marca e conteúdo**: marca, anúncio, slogan, título/imagem principal, logo,
monograma, posição do hero, manifesto, campanha, detalhes, newsletter, rodapé e coleções.
Uploads editoriais usam o mesmo endpoint autenticado de produtos, com validação de arquivo,
otimização e armazenamento persistente Cloudinary. Sem credenciais, o upload apresenta erro
explicativo; não há armazenamento temporário fingindo persistência.

Coleções são configurações editoriais estruturadas em `StoreSettings.editorial` (JSONB),
validadas por Zod e pelo servidor. Cada uma tem slug único, capa, descrição, campanha e IDs
de produtos existentes. As páginas `/collections/[slug]` excluem produtos arquivados.
Nenhum estoque, preço ou disponibilidade é derivado das campanhas. Os quatro conceitos
iniciais não têm produtos associados: Dragon Edition, Knights Collection, Legacy Collection
e Dark Essentials. O cadastro original `Product.collection` continua compatível.

A seleção da homepage usa produtos destacados; novidades são ordenadas por criação e
excluem os já exibidos. Não chamamos produtos demonstrativos de “mais vendidos” sem dados
reais que sustentem a afirmação. O catálogo mantém filtros e paginação no servidor.

## Migração segura

`20261009180000_tkm_editorial` adiciona JSONB e atualiza somente valores exatos da antiga
identidade demonstrativa. Nenhum produto, variante, estoque, pedido ou usuário é removido.
Conteúdo personalizado e rascunhos legais existentes são preservados. Não executar reset ou
reseeding para aplicar esta evolução. Usar `npx prisma migrate deploy` e `npx prisma generate`.

## Mídia e limitações

O material editorial foi obtido da referência fornecida pelo proprietário:
https://tknightsmark.vercel.app/. `shop-banner.png`, `dragon-logo-tshirt.png`,
`dragon-shield-tshirt.png` e `polo-shirt.png` foram otimizados em WebP. Sua utilização é editorial;
não é confirmação de mercadoria, autenticidade fotográfica, preço ou estoque. A origem
não comprova se o material é fotografia ou mockup. Não foram criadas imagens fictícias de
produtos nem associadas essas imagens ao catálogo demonstrativo do Unsplash.

Antes do lançamento: validar direitos dos materiais da marca e substituir os exemplos por
fotografias verificadas; produzir campanha com modelo em cenário arquitetônico/pedra,
frente/costas/detalhes por cor, ficha técnica e tabela de medidas reais. O hero atual usa
referência de peças da marca, pois não foi fornecida uma campanha verificada com modelo.
Vídeo não foi incluído. Os conceitos de coleção ainda precisam de curadoria comercial.

O botão de compra permanece no fluxo normal no celular: a alternativa sticky foi descartada
na revisão visual porque encobria informações. Seleção de variante e disponibilidade continuam
obrigatórias. Cloudinary, pagamentos Stripe de teste e IA não foram exercitados com credenciais
externas reais. Pagamentos reais seguem desativados. Políticas continuam em rascunho.

## Verificação

- TypeScript, ESLint e build de produção.
- 66 testes unitários, incluindo contrato editorial e slugs duplicados.
- 64 testes de integração, incluindo autorização, mídia de terceiros rejeitada,
  associação inválida de produto rejeitada e persistência de configuração válida.
- Playwright: navegação, filtros, estoque, variantes, favoritos, carrinho persistente,
  cupom, checkout sem credenciais, edição de produto, ordenação de imagem e conceitos
  sem estoque inventado; novo teste de persistência editorial no painel.
- Capturas de homepage e produto em 1440 px e 390 px, geradas contra build de produção,
  com fontes e imagens carregadas. Arquivos em `docs/screenshots/tkm`.

Resultado final: 10 testes de navegador passaram, 2 duplicatas mobile foram puladas.
O seletor de textarea do teste novo foi corrigido para usar o nome acessível do campo;
a repetição contra o build de produção passou. Não restam falhas conhecidas nesta suíte.
As medições Lighthouse anteriores em `verification.json` pertencem ao visual AUREO;
não foram reaproveitadas como resultado deste redesign. Testes de
administrador são executados uma vez no desktop; duplicatas mobile são puladas para evitar
mutações concorrentes nos mesmos dados. Fluxos da loja são executados nos dois tamanhos.
