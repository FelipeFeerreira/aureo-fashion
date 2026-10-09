# Operação da marca

Execute `npm run admin:token`, abra `.env.local` localmente e use ADMIN_TOKEN em `/admin`.
A chave não é mostrada aqui. A sessão dura oito horas. Use Sair para revogá-la.

Produtos: criar, editar e arquivar. Arquivar oculta da loja e preserva pedidos.
Informe categoria, coleção, preço em centavos, texto, variantes com SKU único, tamanho,
cor, tom e estoque, medidas e fotografias. Promoções têm janela UTC. A primeira imagem
é a capa. Fotos com cor vazia valem para todas; com uma cor, acompanham a seleção.
Variantes removidas do formulário ficam inativas, preservando referências históricas.

Envio: configure as três variáveis Cloudinary de `.env.example`. Somente donos autenticados
podem enviar. JPEG/PNG/WebP até 5 MB; bytes são decodificados por Sharp e convertidos para
WebP antes de armazenamento persistente. Arraste arquivos, ordene as fotos ou use setas,
selecione a capa, edite textos alternativos e salve o produto. A exclusão no editor é
lógica: desfaz o vínculo, não apaga o objeto externo. Originais órfãos requerem limpeza.

Marca e conteúdo edita nome, slogan, anúncio, hero, cor e rascunhos. Categorias controla
nomes/ordem/imagens da navegação. Pedidos só avançam PAID → SHIPPED → DELIVERED, com
rastreamento. Pagamento só muda pelo webhook. Clientes mostra histórico dos 100 pedidos
mais recentes; Indicadores calcula quantidade e valor confirmado de teste, sem receita
fictícia. Paginação detalhada e exportação operacional são melhorias futuras.

Upload implementado conforme a [API oficial Cloudinary](https://cloudinary.com/documentation/image_upload_api_reference).
Nenhuma conta ou credencial externa foi criada. Valide o upload real após configurar.
