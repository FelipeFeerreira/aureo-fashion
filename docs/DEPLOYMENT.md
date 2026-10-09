# Preparação de implantação

Não houve implantação. O build foi validado localmente. Retire a configuração cron
herdada se não usar a limpeza de demonstração; DEMO_MODE deve permanecer false em loja real.

Use Node 24, PostgreSQL persistente, migrations versionadas, backups/restauração testados,
Cloudinary, HTTPS e proxy que sobrescreva x-forwarded-for. Defina limite de uploads de
6 MB no proxy (5 MB de arquivo), timeouts e logs sem segredos. Os uploads são processados
no servidor; plataformas com limite de request inferior a 6 MB exigem ajustar o limite
ou migrar para upload direto assinado com verificação no backend.

Defina NEXT_PUBLIC_SITE_URL no build e runtime. Guarde segredos apenas no provedor;
nenhum prefixo NEXT_PUBLIC para tokens, APIs privadas ou senhas. Nunca use a base `_test`
na aplicação. Rode `npm ci`, `prisma generate`, `prisma migrate deploy`, `npm run build`.

Pré-lançamento: fotos/produtos/estoque reais, políticas e contato revisados, consentimento
LGPD e retenção, links de cancelamento nos e-mails antes de qualquer campanha (o cancelamento no navegador já funciona), recuperação/MFA
de admin, provedor brasileiro com webhook/assinatura/reconciliação reais, frete, reserva
ou revisão/reembolso, auditoria de segurança e monitoramento. A autorização por chave
única é adequada ao protótipo proprietário; múltiplos operadores exigem identidade e papéis.
