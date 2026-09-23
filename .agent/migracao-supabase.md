# Plano de Migração: Apps Script + Google Sheets → Supabase (Postgres + Auth + RLS)

> Revisado após `.agent/avaliacao.md` — decisões de segurança (RLS, role, RPCs) e de migração de IDs corrigidas conforme a avaliação.

## Decisões tomadas (pré-migração)

- **Provisionamento de usuários:** convite por e-mail (admin convida; usuário define senha no primeiro acesso).
- **Dados existentes:** migrar histórico completo (pedidos, feriados, usuários).
- **Perfis:** `profiles` 1:1 com `auth.users`, criado via trigger; `profiles.role` é a **única fonte da verdade** de autorização (nunca `user_metadata`/JWT).
- **Onboarding:** fluxo curto de "completar perfil" — usuário define senha e confirma **nome** apenas. Role nunca é editável pelo próprio usuário.
- **Regra de prazo:** validação permanece client-side no MVP (dívida consciente); RPC de validação no banco fica para fase posterior.
- **Constraints:** `total_amount >= 0` e `shirt_count + others_items_count > 0`; `delivery_date >= created_at::date` só para novos registros (`NOT VALID`).
- **is_active:** bloqueia acesso via RLS, não só visual.
- **Feriados:** INSERT/DELETE só admin; vendedores só leem.

## Estratégia geral

1. Trabalho na branch `feat/migracao-supabase`, testada até estabilizar, e só depois mergeada.
2. O front continua SPA (Vite + TanStack Router 19) — sem SSR, sem server functions.
3. Substituir `src/services/api.ts` por client Supabase tipado (`src/lib/supabase.ts` + services por recurso).
4. Manter o padrão de providers (`AppProviders`), trocando `DataProvider`/`UserProvider` por versões alimentadas pelo Supabase + sessão real. Depois da migração, avaliar se `DataProvider` ainda faz sentido ou se evolui para hooks específicos (`useOrders()`, `useHolidays()`...) — abstração deve resolver problema, não ganhar pontos de arquitetura.
5. **Provar auth + RLS + CRUD com dados descartáveis antes de migrar qualquer dado real.**

---

## Fase 0 — Setup da branch e projeto Supabase

- [x] `git checkout -b feat/migracao-supabase`.
- [ ] Criar projeto no Supabase; anotar URL e **publishable key** (nomenclatura atual da docs; a antiga `anon` ainda funciona).
- [ ] `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (`VITE_API_URL` removida só no fim).
- [ ] `pnpm add @supabase/supabase-js` (v2).
- [ ] Instalar Supabase CLI para versionar migrations em `supabase/migrations/`.
- [ ] Regra de ouro: publishable key → front ✅; secret/service role → front ❌ (só em Edge Functions).

## Fase 1 — Schema do Postgres

```sql
-- profiles: 1:1 com auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_id text unique,          -- id antigo da planilha (rastreio da migração)
  name text not null,
  role text not null default 'vendedor' check (role in ('admin', 'vendedor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_name text not null,
  shirt_count int not null check (shirt_count >= 0),
  others_items_count int not null default 0 check (others_items_count >= 0),
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  delivery_date date not null,
  is_done boolean not null default false,
  imgurl text,
  check (shirt_count + others_items_count > 0)
);
-- constraint de data só para NOVOS registros (histórico migrado pode violá-la):
alter table public.orders
  add constraint orders_delivery_not_past check (delivery_date >= created_at::date) not valid;

create index on public.orders (delivery_date);
create index on public.orders (user_id);
create index on public.orders (created_at desc);

-- holidays
create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  holiday_description text not null
);
```

- [ ] Trigger `handle_new_user` (security definer revisada com cuidado): ao inserir em `auth.users`, cria profile pegando apenas `name` de `raw_user_meta_data`; **role inicial fixa `'vendedor'`** — promoção a admin é manual (SQL/dashboard). Nunca aceitar `role` do cliente.
- [ ] Funções auxiliares para RLS:
  - `is_admin()`: `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`
  - `is_active_user()`: `exists (select 1 from profiles where id = auth.uid() and is_active)`
- [ ] Sem custom claims / RBAC em JWT por ora — o projeto é pequeno demais para justificar.

## Fase 2 — RLS (Row Level Security)

Modelo: sistema interno, todos leem tudo; escrita restrita por role/ownership. **RLS controla linhas, não colunas** — por isso não existe `UPDATE orders` genérico.

- [ ] `enable row level security` nas 3 tabelas.
- [ ] **profiles:** `SELECT` autenticados (com `is_active_user()`); `UPDATE` apenas do próprio perfil **e** policy/verificação impedindo alteração de `role` e `is_active` pelo próprio usuário (idealmente via RPC `update_own_name` ou column privileges); `INSERT/DELETE` sem policy pública (gestão via service/Edge Function).
- [ ] **orders:** `SELECT` autenticados ativos (KPIs globais da home); `INSERT` com `user_id = auth.uid()`; **sem policy de UPDATE/DELETE para authenticated** — toggle de conclusão via RPC abaixo; `DELETE` só admin.
- [ ] **RPC `complete_order(order_id uuid, done boolean)`** (security definer, escrita cuidadosamente: `search_path` fixo, grants mínimos, checa autenticação): altera **somente `is_done`**. Substitui o `POST ?resource=update_order`.
- [ ] **holidays:** `SELECT` autenticados ativos; `INSERT/DELETE` só `is_admin()`.
- [ ] **Matriz de teste de RLS** (2 usuários de teste: 1 admin, 1 vendedor):

  | Operação | Admin | Vendedor |
  |---|---|---|
  | Ler pedidos | ✅ | ✅ |
  | Criar pedido | ✅ | ✅ |
  | Concluir pedido (RPC) | ✅ | ✅ |
  | Alterar nome/valor do pedido | SQL direto | ❌ |
  | Deletar pedido | ✅ | ❌ |
  | Ler feriados | ✅ | ✅ |
  | Criar/deletar feriado | ✅ | ❌ |
  | Editar próprio nome | ✅ | ✅ |
  | Alterar role (qualquer um) | SQL direto | ❌ |
  | Criar usuário | convite | ❌ |

- [ ] **Testes maliciosos** (logado como vendedor, via API direta): `UPDATE orders SET user_id = <id_admin>`; `UPDATE orders SET total_amount = 999999`; `UPDATE profiles SET role = 'admin'`; `DELETE FROM orders`. Se qualquer um passar, a implementação está errada — mais importante que o fluxo feliz.
- [ ] Testar usuário com `is_active = false`: deve perder acesso aos dados (não só ser deslogado no front).

## Fase 3 — Auth no frontend

- [ ] `src/lib/supabase.ts`: `createClient(url, publishableKey)` singleton.
- [ ] `AuthProvider` (novo contexto): `session`, `user`, `profile`, `isLoading`, `signIn`, `signOut`, `updateProfile`.
  - **Cuidado documentado:** não fazer `await supabase.from(...)` dentro do callback `onAuthStateChange` (risco de deadlock — alerta oficial do Supabase). O callback só atualiza a sessão; o fetch do profile acontece em `useEffect` separado reagindo à sessão. A sessão já é inicializada automaticamente pelo client — sem rotina manual de `initialize()`.
- [ ] Guarda de rotas no `__root.tsx` (ou `beforeLoad`): sem sessão → `/login`; sessão com profile incompleto → `/onboarding`.
- [ ] **Tela de login** (`/login`): fora do shell (sem sidebar), e-mail + senha, erros via `sonner`.
- [ ] **Onboarding** (`/onboarding`): primeiro acesso pelo convite — definir senha e confirmar **nome** (sem campo de role). Depois redirect `/`.
- [ ] **Splash screen personalizada:** estado `isLoading` do `AuthProvider` renderiza tela full-page com **logo SVG da empresa animado** (SVG será enviado depois — componente `SplashScreen` com placeholder; animação via CSS/`tw-animate-css`). Também usada no boot/refresh de sessão.
- [ ] `UserMenu`: usuário logado real (nome/role do profile) + botão **Sair**. Remover seletor de "usuário ativo" (localStorage).
- [ ] `AddUserDialog` → fluxo de convite. No MVP: convite manual pelo **dashboard Supabase** (`inviteUserByEmail`). Fase posterior: Edge Function `invite-user` com service key (nunca no front).

## Fase 4 — Camada de dados (substituir `api.ts`)

- [ ] `src/services/orders.ts`: `listOrders()` (paginação server-side com `.range()` — o "carregar mais" de 50 em 50 vira de fato incremental, sem limite de 500), `createOrder()` (insert direto; validação de prazo client-side no MVP), `toggleOrderDone` via RPC `complete_order`.
- [ ] Nome do vendedor: embed do PostgREST (`select('*, profiles(name)')`) — **sem view `orders_with_seller` no MVP** (prematuro; se um dia criar view, atenção a RLS/`security_invoker`).
- [ ] `src/services/holidays.ts`, `src/services/profiles.ts`.
- [ ] `DataProvider`: manter API do `useData()` (`orders`, `holidays`, `users`→`profiles`, `refresh*`) para **não quebrar consumidores** (`OrdersTable`, KPIs, `lib/orders.ts`).
- [ ] Tipos em `src/types/index.ts`: `User` → `Profile` (novos campos, sem `mail`); `Order` igual; `Holiday` ganha `id`. Opcional: `supabase gen types typescript`.
- [ ] Pós-criação: usar o objeto retornado pelo insert (`.select()`) em vez de re-fetch cego; `refresh*` como fallback simples.

## Fase 5 — Dados de teste

- [ ] Seed descartável (pedidos/feriados fake) para exercitar UI completa com Supabase real.
- [ ] Validar: KPIs, OrdersTable, toggle is_done (RPC), NovoPedido, AddFeriado (só admin), filtros globais.

## Fase 6 — Migração real de dados (one-off)

Script `scripts/migrate-data.mts` (Node + `supabase-js` com **service_role**, roda fora do front), contra **staging primeiro**:

- [ ] Lê `users` (`GET ?resource=users`).
- [ ] Para cada usuário: cria conta no Auth via `auth.admin.createUser` + envia convite; grava profile com `legacy_id` = id antigo da planilha e role correto. Mantém mapa `planilha_id → auth.uuid` em JSON.
  - Os ids antigos **não** viram `auth.users.id` (são UUIDs, mas o vínculo 1:1 com Auth exige o uuid gerado pelo Supabase) — daí o `legacy_id`.
- [ ] Lê `orders` (`GET ?resource=allpedidos`), insere em lotes convertendo `user_id` pelo mapa; **preserva `orders.id`** (a API atual gera com `Utilities.getUuid()` → UUID válido), `created_at`, `delivery_date`, `is_done`, `imgurl`.
- [ ] Lê `holidays` e insere direto.
- [ ] A constraint `orders_delivery_not_past` é `NOT VALID` — histórico violado não bloqueia o insert... validar durante o script se isso exige carga via SQL direto ou `security definer`, e reportar violações.
- [ ] Validar contagens (planilha vs tabela) e amostras de datas (`date` puro, `"YYYY-MM-DD"`, sem timezone).

## Fase 7 — Aceite

- [ ] Login/logout, convite, onboarding, splash screen com logo animado.
- [ ] CRUD pedidos + RPC `complete_order`, feriados (admin only), PWA instalável.
- [ ] Expectativa PWA correta: **instalável, não offline-first** — leitura de dados já carregados pode persistir em tela, mas escritas só online. Sem fila de mutations/sincronização (fase posterior, se necessário).
- [ ] Redeploy Vercel (`vercel.json` SPA já cobre `/login` e `/onboarding`).

## Fase 8 — Limpeza e encerramento

- [ ] Remover `src/services/api.ts` e `VITE_API_URL` (`lib/drive.ts` segue igual).
- [ ] Atualizar `.agent/architecture.md`, `project-context.md`, `contexto da api.md` (marcar como legado), `tasks.md` (Slice 10).
- [ ] Merge da branch → deprecar o Web App do Apps Script (planilha vira backup read-only por 1 mês).

---

## Riscos e cuidados

- **Service role nunca no front** — convites via dashboard ou Edge Function.
- **Datas:** colunas `date` para `delivery_date`/`holiday_date`, enviando `"YYYY-MM-DD"` (evita bugs de timezone do Apps Script).
- **RLS:** policy errada bloqueia silenciosamente — matriz de testes maliciosos antes do merge.
- **`onAuthStateChange`:** nada de chamadas async do Supabase dentro do callback (deadlock).
- **Regra de prazo client-side:** dívida consciente do MVP; qualquer cliente pode chamar a API diretamente com data inválida. Mitigar depois com RPC `create_order` que valida feriados/fds/capacidade no banco.
- **Rollback:** branch isolada + script repetível; planilha intacta até o fim.

## Ordem de execução

1. Fase 0 — branch + projeto Supabase
2. Fase 1 — schema + migrations
3. Fase 2 — RLS + matriz/testes maliciosos
4. Fase 3 — Auth, login, splash, onboarding
5. Fase 4 — services/DataProvider
6. Fase 5 — dados descartáveis
7. Fase 6 — migração real (staging → produção)
8. Fase 7 — aceite
9. Fase 8 — desligar Apps Script
