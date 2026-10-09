# Capturas AUREO

As capturas em `docs/screenshots/aureo` são da aplicação real, com o catálogo
PostgreSQL de demonstração. Não representam vendas, estoque comercial ou pagamentos.

```bash
npx playwright install chromium
# Com o servidor de desenvolvimento ativo:
npm run screenshots
# Ou com um build de produção servido em outra porta:
E2E_BASE_URL=http://localhost:3201 npm run screenshots
```

O script captura homepage e produto em 1440×1000 e 390×844, com página completa.
Não abre admin, não carrega sessões privadas e não usa respostas de IA.
Fotografias de referência: [PHOTOGRAPHY.md](PHOTOGRAPHY.md).
As imagens antigas fora da subpasta `aureo` documentam somente a fundação Ember & Oak.
