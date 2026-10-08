# Architecture & Data Flow

## Fluxo de Comunicação (atual)

```text
React Frontend (SPA) ──supabase-js──▶ Supabase (Auth + Postgres + RLS + RPCs + Edge Functions)
```

## Arquitetura de Camadas

- **Frontend (React):** UI, estado local/global, formulários, tabelas, dashboard, consumo do Supabase. Animações declarativas com `framer-motion` (importado da raiz como `motion`/`AnimatePresence`).
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
- **Usuário ativo = sessão:** não há mais `UserProvider` nem `useActiveUser` — tudo lê `useAuth().profile`. O `UserProvider` virou shim ("usuário ativo" da era localStorage) e foi removido na limpeza das pendências.

## Decisões de Frontend (estado atual)

- **Stack real:** TanStack **Router** + Vite (SPA pura). Rotas: `/` (dashboard), `/producao`, `/calendario` (Calendário de Produção), `/pedidos` (aceita `?q=` — busca por nome do pedido), `/feriados`, `/login`, `/onboarding` (essas duas fora do shell — `__root.tsx` decide pelo pathname).
- **Seletores de data:** chevrons do `DaySelector` navegam só por dias úteis e o calendário bloqueia fds/feriados (mesma regra do form de pedido); calendário sempre abre no mês da data selecionada; **`DateMaskInput`** (DD/MM/AAAA, máscara automática, valida data real + fds/feriados; dia só → completa mês/ano da data do campo, dia+mês → completa o ano; foco seleciona tudo). No `DaySelector` vive dentro do popover; no form de pedido é o próprio trigger do calendário (campo único). Botões extras: "voltar para hoje" (CalendarArrowDown) e "dia de agendamento mais distante" (CalendarClock — só na home, calcula por `production_date`).
- **`production_date`:** calculado só no front (`productionDateOf`/`ordersForProductionDay` em `lib/orders.ts` = 2 dias úteis antes de `delivery_date`). Home: KPIs e lista do dia seguem `production_date`; o hint entre parênteses mostra o `delivery_date` (`businessDaysForward`). Coluna "Produção" nas duas variants do `OrdersTable`. `/producao`: olha `created_at` (encomendas), KPIs = pedidos fechados + valor vendido, escopo por usuário (admin alterna via dropdown; default = sessão atual).
- **Dias úteis até a data (Slice 21):** `getBusinessDaysUntil(date, holidays, today = new Date())` em `lib/dates.ts` devolve `BusinessDaysResult` (`'past'` | `'today'` | `'future'` com `businessDays`), contando a janela `(hoje, alvo]` e ignorando fds/feriados — usado na linha "Visão diária …" da home e na distância do modal de pedido; `today` injetável para testes determinísticos.
- **Criação de pedido (Slice 21):** datas no passado bloqueadas **só na criação** (matcher `{ before: hoje }` no calendário + prop `disallowPast` no `DateMaskInput` com toast + guarda no submit; edição fica livre). `ordersDeliveredOnDay` (exportado de `lib/orders.ts`, entrega por `delivery_date`) alimenta o resumo "N pedidos · M peças" abaixo do hint de produção. O calendário do modal fecha no `Tab` com `focusSibling` devolvendo o foco ao campo vizinho do form — sem `preventDefault`, o `DayPicker` (um dia sempre com `tabIndex=0`) levaria o foco ao `body` ao desmontar.
- **Viewer de imagem:** `OrderImageViewer` (portal) compartilhado — overlay limpo, ~70vh, fecha em clique fora/Esc, zoom por clique na imagem (1x ↔ 2.5x).
- **Home dia/mês:** segmented control em todos os breakpoints; visão dia = KPIs de dia + tabela (largura total), visão mês = KPIs de mês + `ProductionChart`.
- **Tabelas:** layout elástico com teto nas colunas de texto — nome do pedido `max-w-[30ch]` + truncate + `title` com o nome completo no hover (vendedor `max-w-[14ch]`, feriado `max-w-[40ch]`); datas/números `whitespace-nowrap`. Cabeçalhos sticky em `top-16` (abaixo do Header de 64px) via base em `ui/table.tsx`. Colunas sticky no scroll horizontal da tabela: `is_done` à esquerda e ações (edit/delete) à direita (`bg-card`, cantos com `z-30`). Scroll vertical é da página; scroll horizontal existe **só dentro do wrapper da tabela**, e **só abaixo de lg** (`overflow-x-auto lg:overflow-x-visible` no container do `Table`): qualquer overflow no wrapper o transforma em scrollport e quebra o sticky do header em relação à página — por isso em lg+ o wrapper fica sem overflow (a tabela cabe graças aos tetos de coluna) e o `sticky top-16` passa a colar no scroll da página. Em `< lg` o header vertical não é sticky (trade-off: prioriza o scroll horizontal com checkbox/ações visíveis). A página nunca rola pro lado (`min-w-0` na cadeia do shell).
- **Checkbox de conclusão** é o componente compartilhado `src/components/OrderDoneCheckbox.tsx` (consome `useData().toggleOrderDone`, read-only para `designer`, com `stopPropagation` e rollback no erro) — usado na `OrdersTable` e no card do calendário. No `variant="day"` a linha é o `AnimatedTableRow` (`motion.tr layout="position"`), então concluir um pedido o desliza para a seção de concluídos; durante a animação o `transform` do Framer desfaz o `sticky` das células laterais, voltando ao normal quando ela termina.

### Calendário de Produção (`/calendario`, Slices 15/16/17/18/20)

- **O que é:** agenda visual da produção por `production_date` (2 dias úteis antes da entrega) — mesma base da home, mas em grade. Só entram pedidos **não concluídos** e o escopo Todos/Somente eu aparece para qualquer role (a home restringe o escopo a admin). `groupOrdersByProductionDate` (`lib/production-calendar.ts`) faz a filtragem e o agrupamento por `toDateKey`; `getOrdersForDay`/`grouped.get()` devolvem os pedidos do dia.
- **Três visões** (dropdown da toolbar): `month` (grade de 35/42 células com cabeçalho de dias da semana), `7-days` e `3-days` (um card de largura total por dia, lista rolando internamente). A grade mensal **não lista pedidos**: cada célula com pedidos mostra um botão contador ("N pedidos pendentes" / tooltip "Ver todos os N pedidos pendentes") que chama `onExpandDay(day)` → `setView('3-days', day)`. O card completo (nome truncado em 12 chars, ícone `FileText` primário quando há `imgurl`, seta de "Ir para o pedido" no hover, checkbox de conclusão) é exclusivo das visões 3/7 dias, via `ProductionCalendarOrder` — o antigo `variant="cell"` foi removido na Slice 18.
- **Estado** em `useProductionCalendar` (`src/hooks/use-production-calendar.ts`): `view`, `scope`, `anchorDate` + derivados (`visibleDays`, `periodLabel`) e navegação (`goPrev`/`goNext`/`goToday`/`jumpToMonth`). `view`/`scope` são persistidos em localStorage, mas o reset ao entrar na rota tem a última palavra — o calendário **sempre abre** na visão mês, escopo Todos e mês atual.
- **Âncora ao trocar de visão** (`normalizeAnchorForView`, Slice 16.5): visão mês → 1º dia do mês da âncora; 3/7 dias → hoje quando a âncora já está no mês atual, senão o 1º dia do mês da âncora. Só normaliza quando a visão realmente muda (reclicar na opção atual não move nada) e uma âncora explícita tem prioridade — é o que o botão contador do mês usa (`setView('3-days', day)`).
- **Navegação de período (toolbar):** grupo `[hoje] ‹ [período] ›` à direita — botão "hoje" (`CalendarArrowDown` com tooltip, desabilitado quando o período já é o atual), chevrons (`goPrev`/`goNext` movem ±1 mês, ±7 dias e **±3 dias** na visão 3 dias) e o `MonthSelector` no meio mostrando o `periodLabel` (ex.: "28 de set. – 03 de out."). Escolher um mês no popover (`jumpToMonth`) sempre volta para a visão mês. Os hotkeys `←`/`→` ficam **sem efeito** em `/calendario` (`GlobalHotkeys` compara o `pathname`) — antes eles dependiam do `CalendarNavigationContext`, que foi removido por nunca ser alcançado (`GlobalHotkeys` é montado no `__root.tsx`, fora do provider).
- **Cadeia de altura (Slice 16.6/16.7):** a raiz do `ProductionCalendar` é o container `flex flex-col h-full min-h-0` que herda a altura do `<main>` (sem wrapper na rota); toolbar `shrink-0`; conteúdo `relative flex min-h-0 flex-1 flex-col overflow-auto` — **coluna flex**, é isso que faz os filhos esticarem até a base; quem rola é o wrapper, a página nunca. O piso de altura (`min-h-[360px]`) fica na **raiz** da grade mensal (e não no card, que tem `overflow-hidden` e cortaria a última semana): em janela baixa o card estoura inteiro e o wrapper rola. Os cards das visões 3/7 dias vão até a base, sem `p-4`, e cada coluna rola a própria lista (`overflow-y-auto`).
- **Scroll horizontal no mobile (Slice 20):** as visões 3/7 dias usam um único scrollport `flex gap-3 overflow-x-auto` com cards em `flex-1 min-w-[300px]` — o `min-width` trava o piso e o `flex-grow` ainda divide a largura toda no desktop, sem breakpoint. Na grade mensal o scrollport fica **entre** a raiz e o card, com cabeçalho e células juntos (as colunas não desalinham) e `min-w-[840px]` no card (7 × 120px). Tem `lg:overflow-visible` porque em CSS `overflow-x: auto` força `overflow-y: auto` — sem o reset, o card viraria também o scrollport vertical e quebraria a cadeia de altura acima.
- **Animações (Slice 17, `framer-motion`):** as visões 3/7 dias têm exit animation no card de pedido — `ProductionCalendarOrder` é um `motion.div` (`height: 0 → auto`, `x: -20` no exit) dentro de um `AnimatePresence` em `ProductionCalendarDays`, e o estado vazio mora **dentro** dele (key `"empty"`) para concluir o último pedido ainda rodar a saída. O `AnimatePresence` tem `key={days[0]?.getTime()}`: concluir um pedido não mexe na âncora, mas navegar de período remonta a lista e troca as telas sem animar. Na home, `OrdersTable` usa `AnimatedTableRow` (`motion.tr layout="position"`) só no `variant="day"`, onde a linha muda de posição entre `[...pendingOrders, ...doneOrders]`.
- **Pedido com imagem** abre o `OrderImageViewer` compartilhado; a seta de follow vai para `/pedidos` com `search: { q: <nome do pedido> }` — a paleta faz o mesmo pelo nome do pedido (não existe `?focus=<id>` em lugar nenhum do app).
- **Chave de dia sempre por `toDateKey`** (não `toISOString()`, que em UTC+ atrasa a meia-noite local em um dia) — vale para a busca no `grouped` e para a `key` React da coluna, nas duas visões. Há teste com `TZ=Asia/Tokyo` e `TZ=America/Sao_Paulo` em `src/lib/production-calendar.test.ts` para travar isso.
- **Testes:** `src/lib/production-calendar.test.ts` (36 casos, vitest) — rodam com `pnpm vitest run`, já que o `package.json` não tem script `test`.

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

- **Scrollbars:** slim e temáticas via `styles.css` — `color-scheme: dark` no bloco `.dark` (nativas/Firefox/form controls) + `::-webkit-scrollbar` de 10px com thumb `--border` (light, quase invisível) / `--muted` (dark), hover `--muted-foreground`, trilha transparente; Firefox via `scrollbar-width/color`.
- **Calendários com visual único:** o painel do Novo Pedido usa as classes do `PopoverContent` + `data-slot="popover-content"` (regra `in-data-[slot=popover-content]` do `ui/calendar`, que limpa o fundo) + animação fade/zoom — idêntico ao do `DaySelector`, só com âncora própria (abaixo/acima do input por breakpoint).

### Funcionalidades globais

- **Hotkeys** (`GlobalHotkeys` + `react-hotkeys-hook`): `Ctrl/Cmd+K` paleta de comandos (`CommandPaletteProvider` + `CommandPalette`; pedidos com checkbox is_done, vendedor + valor, botão follow → `/pedidos` com `search: { q: <nome do pedido> }`; pedido com `imgurl` clicável abre o viewer), `N` novo pedido, `S` toggle sidebar, `H`/`P`/`F`/`D`/`C` navegação (Home/Pedidos/Feriados/Produção/Calendário), `←`/`→` trocam o dia útil (`shiftSelectableDay`, sábado liberado só em `/producao`) — **sem efeito em `/calendario`**, onde a navegação de período é pelos botões da toolbar. Não disparam dentro de inputs.
- **Sidebar:** dois grupos com título — "Acompanhamento" (Home, Produção, Calendário) e "Cadastros" (Pedidos, Feriados).
- **Splash screen:** `SplashLogo` (SVG inline animado — queda → squash → transformação no wordmark, loop 2s) + `useSplashGate` (mínimo 2s).
- **Identidade visual:** `public/logodtex.svg`/`logodtex-animar.svg` (sidebar/login), `dtex192/512.png` (favicon/PWA, theme-color `#FF781F`).

## Contrato do banco (Supabase)

- **profiles:** `id` (1:1 auth.users), `name`, `role`, `is_active`, `onboarding_completed`, `created_at`. Trigger `handle_new_user` cria profile lendo só `name` de metadata (role inicial fixa `'vendedor'`).
- **orders:** `id`, `user_id`, `order_name`, `shirt_count`, `others_items_count`, `total_amount`, `created_at`, `delivery_date` (date puro), `is_done`, `imgurl`. Constraints: valores ≥ 0, peças > 0, `delivery_date >= created_at::date` (NOT VALID — só novos).
- **holidays:** `id`, `holiday_date` (date, unique), `holiday_description`.
- Migrations versionadas em `supabase/migrations/` (0001 schema, 0002 RLS, 0003 onboarding, 0004 designer/admin/pedidos). Edge Function em `supabase/functions/invite-user/`.

## Legado

- Apps Script + Google Sheets (`contexto da api.md`): desligado do front em produção nesta branch; `src/services/api.ts` e `VITE_API_URL` removidos. Planilha permanece como backup read-only até o fim da migração de dados (agora manual).
