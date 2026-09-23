# Legado (já desligado): API Apps Script + Google Sheets

> ⚠️ **Documento histórico.** Esta arquitetura foi substituída por Supabase (ver `architecture.md` e `migracao-supabase.md`). A planilha permanece apenas como backup read-only durante a transição; o front desta branch não consome mais essa API.

API anterior usando Google Apps Script + Google Sheets (usada por ~1 ano como protótipo).

Estrutura das planilhas (referência para a migração manual de dados):

- users: `id`, `name`, `mail`, `role`, `is_active`
- orders: `id`, `user_id`, `order_name`, `shirt_count`, `others_items_count`, `total_amount`, `created_at`, `delivery_date`, `is_done`, `imgurl`
- holidays: `holiday_date`, `holiday_description`

A migração de dados agora é **manual**: trocar o `user_id` da planilha pelo uuid do Supabase correspondente antes de importar, mantendo o vínculo pedido→vendedor (`orders.id`, UUIDs gerados pela API antiga, podem ser preservados).

URLs de imagem do Drive aceitas pelo front (`src/lib/drive.ts`, ainda em uso): `drive.google.com/file/d/<ID>/...` e `drive.google.com/open?id=<ID>` → `https://lh3.googleusercontent.com/d/<ID>`.
