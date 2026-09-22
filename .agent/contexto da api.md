Estou desenvolvendo uma API simples usando Google Apps Script + Google Sheets, que será usada por no máximo 1 ano antes de migrarmos para uma arquitetura mais robusta.

Estrutura das planilhas:

- users: `id`, `name`, `mail`, `role`, `is_active`
- orders: `id`, `user_id`, `order_name`, `shirt_count`, `others_items_count`, `total_amount`, `created_at`, `delivery_date`, `is_done`, `imgurl`
  - `is_done`: boolean; criado como `false` no POST (o front não envia esse campo)
  - `imgurl`: texto, URL de imagem do Google Drive (opcional; pode ser vazio)
- holidays: `holiday_date`, `holiday_description`

A API usa uma única URL de Web App, com:

- `doGet(e)`
- `doPost(e)`
- roteamento por `?resource=users|orders|holidays`

Decisões:

- GET retorna os dados completos para o frontend.
- Filtros, busca, sort e paginação visual ficam no frontend.
- GET usa cache de aproximadamente 1 hora.
- POST invalida o cache correspondente depois que a escrita na planilha é concluída com sucesso.
- IDs são gerados no backend com Utilities.getUuid().
- `created_at` é gerado no backend com new Date().
- Datas de calendário (`delivery_date` e `holiday_date`) devem chegar do frontend como `YYYY-MM-DD` e são convertidas no Apps Script para objetos `Date` sem timezone nem horário antes de serem salvas no Google Sheets, para que a planilha mantenha datas reais.
