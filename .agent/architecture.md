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

- **Stack real:** TanStack **Router** + Vite (SPA pura). Rotas: `/` (dashboard), `/producao`, `/pedidos` (aceita `?focus=<id>` — "follow" da paleta), `/feriados`, `/login`, `/onboarding` (essas duas fora do shell — `__root.tsx` decide pelo pathname).
- **Seletores de data:** chevrons do `DaySelector` navegam só por dias úteis e o calendário bloqueia fds/feriados (mesma regra do form de pedido); calendário sempre abre no mês da data selecionada; **`DateMaskInput`** (DD/MM/AAAA, máscara automática, valida data real + fds/feriados; dia só → completa mês/ano da data do campo, dia+mês → completa o ano; foco seleciona tudo). No `DaySelector` vive dentro do popover; no form de pedido é o próprio trigger do calendário (campo único). Botões extras: "voltar para hoje" (CalendarArrowDown) e "dia de agendamento mais distante" (CalendarClock — só na home, calcula por `production_date`).
- **`production_date`:** calculado só no front (`productionDateOf`/`ordersForProductionDay` em `lib/orders.ts` = 2 dias úteis antes de `delivery_date`). Home: KPIs e lista do dia seguem `production_date`; o hint entre parênteses mostra o `delivery_date` (`businessDaysForward`). Coluna "Produção" nas duas variants do `OrdersTable`. `/producao`: olha `created_at` (encomendas), KPIs = pedidos fechados + valor vendido, escopo por usuário (admin alterna via dropdown; default = sessão atual).
- **Viewer de imagem:** `OrderImageViewer` (portal) compartilhado — overlay limpo, ~70vh, fecha em clique fora/Esc, zoom por clique na imagem (1x ↔ 2.5x).
- **Home dia/mês:** segmented control em todos os breakpoints; visão dia = KPIs de dia + tabela (largura total), visão mês = KPIs de mês + `ProductionChart`.
- **Tabelas:** colunas sticky — `is_done` à esquerda e ações (edit/delete) à direita (`bg-card`).

### Sistema de UI

- shadcn com registry **`base-vega` (Base UI)** — sem Radix. Composição via prop **`render`** (não `asChild`).
- Componentes novos: `ui/dialog` (confirm de exclusão), selects nativos no gerenciador de usuários.

### Funcionalidades globais

- **Hotkeys** (`GlobalHotkeys` + `react-hotkeys-hook`): `Ctrl/Cmd+K` paleta de comandos (`CommandPaletteProvider` + `CommandPalette`; pedidos com checkbox is_done, vendedor + valor, botão follow → `/pedidos?focus=<id>`; pedido com `imgurl` clicável abre o viewer), `N` novo pedido, `S` toggle sidebar, `H`/`P`/`F`/`D` navegação (Home/Pedidos/Feriados/Produção). Não disparam dentro de inputs.
- **Sidebar:** dois grupos com título — "Acompanhamento" (Home, Produção) e "Cadastros" (Pedidos, Feriados).
- **Splash screen:** `SplashLogo` (SVG inline animado — queda → squash → transformação no wordmark, loop 2s) + `useSplashGate` (mínimo 2s).
- **Identidade visual:** `public/logodtex.svg`/`logodtex-animar.svg` (sidebar/login), `dtex192/512.png` (favicon/PWA, theme-color `#FF781F`).

## Contrato do banco (Supabase)

- **profiles:** `id` (1:1 auth.users), `name`, `role`, `is_active`, `onboarding_completed`, `created_at`. Trigger `handle_new_user` cria profile lendo só `name` de metadata (role inicial fixa `'vendedor'`).
- **orders:** `id`, `user_id`, `order_name`, `shirt_count`, `others_items_count`, `total_amount`, `created_at`, `delivery_date` (date puro), `is_done`, `imgurl`. Constraints: valores ≥ 0, peças > 0, `delivery_date >= created_at::date` (NOT VALID — só novos).
- **holidays:** `id`, `holiday_date` (date, unique), `holiday_description`.
- Migrations versionadas em `supabase/migrations/` (0001 schema, 0002 RLS, 0003 onboarding, 0004 designer/admin/pedidos). Edge Function em `supabase/functions/invite-user/`.

## Legado

- Apps Script + Google Sheets (`contexto da api.md`): desligado do front em produção nesta branch; `src/services/api.ts` e `VITE_API_URL` removidos. Planilha permanece como backup read-only até o fim da migração de dados (agora manual).
