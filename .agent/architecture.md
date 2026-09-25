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
- **`DataProvider`** mantém a API `useData()` (`orders`/`holidays`/`users` + `refresh*` + `toggleOrderDone` otimista) — consumidores (`OrdersTable`, KPIs, `lib/orders.ts`) inalterados. Fetch inicial: mês atual + futuros; histórico em background. **Polling silencioso a cada 5 min** (pedidos + feriados + usuários, sem loading/toast) — pausa com a aba oculta e atualiza na hora ao voltar (`visibilitychange`). Dados limpos no logout.
- **`UserProvider`** virou shim: `activeUser` = profile da sessão (não há mais "trocar de usuário").

## Decisões de Frontend (estado atual)

- **Stack real:** TanStack **Router** + Vite (SPA pura). Rotas: `/` (dashboard), `/producao`, `/pedidos` (aceita `?focus=<id>` — "follow" da paleta), `/feriados`, `/login`, `/onboarding` (essas duas fora do shell — `__root.tsx` decide pelo pathname).
- **Seletores de data:** chevrons do `DaySelector` navegam só por dias úteis e o calendário bloqueia fds/feriados (mesma regra do form de pedido); calendário sempre abre no mês da data selecionada; **`DateMaskInput`** (DD/MM/AAAA, máscara automática, valida data real + fds/feriados; dia só → completa mês/ano da data do campo, dia+mês → completa o ano; foco seleciona tudo). No `DaySelector` vive dentro do popover; no form de pedido é o próprio trigger do calendário (campo único). Botões extras: "voltar para hoje" (CalendarArrowDown) e "dia de agendamento mais distante" (CalendarClock — só na home, calcula por `production_date`).
- **`production_date`:** calculado só no front (`productionDateOf`/`ordersForProductionDay` em `lib/orders.ts` = 2 dias úteis antes de `delivery_date`). Home: KPIs e lista do dia seguem `production_date`; o hint entre parênteses mostra o `delivery_date` (`businessDaysForward`). Coluna "Produção" nas duas variants do `OrdersTable`. `/producao`: olha `created_at` (encomendas), KPIs = pedidos fechados + valor vendido, escopo por usuário (admin alterna via dropdown; default = sessão atual).
- **Viewer de imagem:** `OrderImageViewer` (portal) compartilhado — overlay limpo, ~70vh, fecha em clique fora/Esc, zoom por clique na imagem (1x ↔ 2.5x).
- **Home dia/mês:** segmented control em todos os breakpoints; visão dia = KPIs de dia + tabela (largura total), visão mês = KPIs de mês + `ProductionChart`.
- **Tabelas:** layout elástico com teto nas colunas de texto — nome do pedido `max-w-[30ch]` + truncate + `title` com o nome completo no hover (vendedor `max-w-[14ch]`, feriado `max-w-[40ch]`); datas/números `whitespace-nowrap`. Cabeçalhos sticky em `top-16` (abaixo do Header de 64px) via base em `ui/table.tsx`. Colunas sticky no scroll horizontal da tabela: `is_done` à esquerda e ações (edit/delete) à direita (`bg-card`, cantos com `z-30`). Scroll vertical é da página; scroll horizontal existe **só dentro do wrapper da tabela**, e **só abaixo de lg** (`overflow-x-auto lg:overflow-x-visible` no container do `Table`): qualquer overflow no wrapper o transforma em scrollport e quebra o sticky do header em relação à página — por isso em lg+ o wrapper fica sem overflow (a tabela cabe graças aos tetos de coluna) e o `sticky top-16` passa a colar no scroll da página. Em `< lg` o header vertical não é sticky (trade-off: prioriza o scroll horizontal com checkbox/ações visíveis). A página nunca rola pro lado (`min-w-0` na cadeia do shell).

### Sistema de UI

- shadcn com registry **`base-vega` (Base UI)** — sem Radix. Composição via prop **`render`** (não `asChild`).
- Componentes novos: `ui/dialog` (confirm de exclusão), selects nativos no gerenciador de usuários.

### Layout e responsividade (Slice 13)

- **Desktop (lg+): sem scroll de página** — o shell trava na viewport (`__root`: `lg:h-dvh lg:overflow-hidden`; `main` flex `min-h-0 overflow-hidden`). Em todas as rotas: toolbar/KPIs `shrink-0`, card da lista `flex-1 min-h-0`, e a **tabela rola internamente** (`lg:overflow-y-auto` no wrapper) — o header sticky das tabelas (`top-0`) funciona dentro desse scroll container. Abaixo de lg o comportamento é o clássico: página rola inteira.
- **Cards KPI com altura estável** (estratégia híbrida): bloco composto (ícone+texto, ex.: "% que o mês passado") usa `invisible`; linha de texto simples (ex.: "cota estourada…") usa `'&nbsp;'` — o card nunca muda de altura ao ligar/desligar linhas condicionais.
- **`KpiPair`** (`src/components/KpiPair.tsx`): par de cards KPI. Em sm+ é o grid simétrico de 2 colunas; no mobile vira carrossel com peek (card ~85%, scroll snap, scrollbar escondida, bolinhas via onScroll clicáveis). Usado na home (dia e mês) e em `/producao`.
- **Home:** top bar unificada (estilo `/producao`) — segmented Dia/Mês à esquerda; à direita: escopo global Todos/Somente eu (**só admin**, afeta KPIs de dia, mês e tabela) + DaySelector/MonthSelector conforme a visão. No mobile fica em 2 linhas (linha 1: segmented esq. + escopo dir.; linha 2: seletor centralizado), mesmo padrão de /producao com o escopo renderizado por breakpoint. Substituídos o segmented centralizado e os dois controles de escopo antigos.
- **Header mobile:** logo (esq) = trigger da sidebar (Sheet), título centralizado, só "+" (novo pedido) à direita; cor primária e tema moram no `UserMenu` (só `lg:hidden`) — no desktop ficam no Header. Clique em rota da sidebar no mobile recolhe a Sheet (`setOpenMobile(false)` no onClick dos itens).
- **/producao mobile:** linha 1 = segmented (esq) + dropdown de escopo (dir); linha 2 = seletor de dia/mês centralizado. Desktop mantém linha única (dropdown renderizado duplicado por breakpoint).
- **Modais:** `ui/dialog.tsx` — `DialogContent` abre a `top-[20%]` (não mais centrado a 50%) e **sem overflow/max-h** (qualquer overflow clipa conteúdo ancorado fora da caixa). O calendário do Novo Pedido é ancorado ao input via CSS (`absolute` num wrapper `relative`): abre logo abaixo do input no desktop e **acima do input no mobile** (`useIsMobile`) — sem clipping porque o `DialogContent` não tem overflow. (A âncora `fixed` + `getBoundingClientRect` foi descartada: a medição caía no meio da animação de entrada do modal e posicionava errado.) Vale para paleta, feriados, confirmações etc. Dica sob a data do pedido: "A produção da fábrica será dia {dd/mm}" (`businessDaysBack(delivery, 2, holidays)`).
- **Touch (`useIsTouch`, `pointer: coarse`):** calendários nunca abrem teclado virtual no mobile — `DateMaskInput` vira `readOnly` (campo só de exibição, data escolhida por toque no calendário) e o popover do `DaySelector` omite o input mascarado. Desktop inalterado (máscara + autocomplete).

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
