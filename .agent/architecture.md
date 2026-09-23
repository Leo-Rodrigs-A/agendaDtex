# Architecture & Data Flow

## Fluxo de Comunicação (atual)

```text
React Frontend (SPA) ──supabase-js──▶ Supabase (Auth + Postgres + RLS + RPCs + Edge Functions)
```

## Arquitetura de Camadas

- **Frontend (React):** UI, estado local/global, formulários, tabelas, dashboard, consumo do Supabase.
- **Gerenciador de pacotes:** pnpm
- **Backend (Supabase):** Postgres + Auth (e-mail/senha + convite) + RLS + RPCs (security definer) + Edge Function `invite-user`.
- **Persistência:** Postgres (tabelas `profiles`, `orders`, `holidays`).

## Autenticação e Autorização

- **Auth real:** Supabase Auth; sessão persistida no localStorage pelo `supabase-js` (auto-refresh).
- **`AuthProvider`** (`src/components/AuthProvider.tsx`): `session`/`profile`/`isLoading`/`signIn`/`signOut`/`refreshProfile`. **Nunca** chamar Supabase dentro do callback `onAuthStateChange` (deadlock) — profile carrega em `useEffect` separado; `profileReady` evita race condition no boot.
- **`AuthGate`** (`src/components/AuthGate.tsx`): sem sessão → `/login`; sessão com `onboarding_completed = false` → `/onboarding`; usuário `is_active = false` → logout. Splash com `useSplashGate` (mínimo 2s = 1 loop da animação do logo).
- **Roles:** `profiles.role` é a única fonte (`admin` | `vendedor` | `designer`). `admin` gerencia usuários/feriados; `vendedor` cria/edita próprios pedidos; `designer` **somente leitura**. Helpers SQL: `is_admin()`, `is_staff()`, `is_active_user()`.
- **RLS controla linhas, não colunas** — mutações específicas expostas via RPCs (security definer): `complete_order`, `update_order`, `delete_order`, `complete_onboarding`, `update_own_name`, `admin_update_user`.

## Dados (camada de serviços)

- `src/lib/supabase.ts` — client singleton (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`).
- `src/services/orders.ts` — `listOrders`, `listOrdersFrom` (fetch escalonado), `createOrder`, `toggleOrderDone` (RPC), `updateOrder`, `deleteOrder` (RPCs).
- `src/services/holidays.ts`, `src/services/profiles.ts` (+ `inviteUser` via Edge Function, `adminUpdateUser` RPC).
- **`DataProvider`** mantém a API `useData()` (`orders`/`holidays`/`users` + `refresh*` + `toggleOrderDone` otimista) — consumidores (`OrdersTable`, KPIs, `lib/orders.ts`) inalterados. Fetch inicial: mês atual + futuros; histórico em background. Dados limpos no logout.
- **`UserProvider`** virou shim: `activeUser` = profile da sessão (não há mais "trocar de usuário").

## Decisões de Frontend (estado atual)

- **Stack real:** TanStack **Router** + Vite (SPA pura). Rotas: `/` (dashboard), `/pedidos`, `/feriados`, `/login`, `/onboarding` (essas duas fora do shell — `__root.tsx` decide pelo pathname).
- **Seletores de data:** chevrons do `DaySelector` navegam só por dias úteis e o calendário bloqueia fds/feriados (mesma regra do form de pedido); calendário sempre abre no mês da data selecionada. Botões extras: "voltar para hoje" (CalendarArrowDown) e "dia de agendamento mais distante" (CalendarClock — altera só o dia, sem tocar o mês dos KPIs).
- **Lembrete de produção (home):** junto de todo `dayLabel` aparece a data de 2 dias úteis antes (`businessDaysBack` em `lib/dates.ts`) — em parênteses, menor e sem cor primária, para apressar a produção.

### Sistema de UI

- shadcn com registry **`base-vega` (Base UI)** — sem Radix. Composição via prop **`render`** (não `asChild`).
- Componentes novos: `ui/dialog` (confirm de exclusão), selects nativos no gerenciador de usuários.

### Funcionalidades globais

- **Hotkeys** (`GlobalHotkeys` + `react-hotkeys-hook`): `Ctrl/Cmd+K` paleta de comandos (`CommandPaletteProvider` + `CommandPalette`, abre também pelo botão "Encontrar" na sidebar; pedido com `imgurl` é clicável e abre a imagem), `N` novo pedido, `S` toggle sidebar, `H`/`P`/`F` navegação. Não disparam dentro de inputs.
- **Splash screen:** `SplashLogo` (SVG inline animado — queda → squash → transformação no wordmark, loop 2s) + `useSplashGate` (mínimo 2s).
- **Identidade visual:** `public/logodtex.svg`/`logodtex-animar.svg` (sidebar/login), `dtex192/512.png` (favicon/PWA, theme-color `#FF781F`).

## Contrato do banco (Supabase)

- **profiles:** `id` (1:1 auth.users), `name`, `role`, `is_active`, `onboarding_completed`, `created_at`. Trigger `handle_new_user` cria profile lendo só `name` de metadata (role inicial fixa `'vendedor'`).
- **orders:** `id`, `user_id`, `order_name`, `shirt_count`, `others_items_count`, `total_amount`, `created_at`, `delivery_date` (date puro), `is_done`, `imgurl`. Constraints: valores ≥ 0, peças > 0, `delivery_date >= created_at::date` (NOT VALID — só novos).
- **holidays:** `id`, `holiday_date` (date, unique), `holiday_description`.
- Migrations versionadas em `supabase/migrations/` (0001 schema, 0002 RLS, 0003 onboarding, 0004 designer/admin/pedidos). Edge Function em `supabase/functions/invite-user/`.

## Legado

- Apps Script + Google Sheets (`contexto da api.md`): desligado do front em produção nesta branch; `src/services/api.ts` e `VITE_API_URL` removidos. Planilha permanece como backup read-only até o fim da migração de dados (agora manual).
