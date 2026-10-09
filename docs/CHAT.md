# Assistente de moda opcional

Ative a interface com `NEXT_PUBLIC_ASSISTANT_ENABLED=true`. Sem ANTHROPIC_API_KEY,
mostra o fallback em português e não chama o provedor. Com chave, configure também o
limite financeiro no painel Anthropic e teste qualidade com perguntas reais.

Preserva as proteções da fundação: ferramentas estritas, histórico server-side, sessão
opaca, lease de um turno por vez, 20 mensagens/sessão, 30 tentativas/IP/15 min, 250
admissões/dia, 400 tokens e nenhuma publicação de prosa livre do modelo. Preço e estoque
vêm do banco; busca usa categoria, cor, tamanho e orçamento; detalhes incluem material
e modelagem. Produtos arquivados são excluídos. Histórico recarrega preços atuais.

Pedidos exigem número e e-mail juntos na mensagem atual, sem recuperação de credenciais
antigas. A resposta nunca inclui endereço ou IDs de pagamento. A interface avisa que
mensagens podem ser enviadas à Anthropic; e-mails são ocultados na transcrição persistida.

O conhecimento de políticas é conservador: condições comerciais continuam em rascunho.
O assistente orienta a ler as páginas, sem prometer descontos, entregas ou reembolsos.
Nenhuma chamada real foi feita durante o desenvolvimento; testes usam respostas
controladas. Reavalie prompts e retenção antes de ativar para clientes.
