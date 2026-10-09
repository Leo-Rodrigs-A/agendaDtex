# Backlog & Tasks

## Slice 1: Layout, Sidebar e Topbar ✅

- [x] Criar componente `AppSidebar.tsx` com navegação e logo
- [x] Criar componente `Header.tsx` (Topbar com título dinâmico por rota)
- [x] Configurar layout raiz em `src/routes/__root.tsx` com `SidebarProvider`
- [x] Configurar rotas base (`/`, `/pedidos`, `/feriados`)
- [x] Migrar `AppSidebar` para a API Base UI (`render` no lugar de `asChild`) e remover link aninhado
- [x] Remover `src/router.tsx` (dead code do template — router vive em `main.tsx`)

## Slice 2: Filtros globais e Dashboard ✅

- [x] Instalar `ui/popover` e `ui/calendar` (shadcn base-vega / Base UI + react-day-picker)
- [x] Criar `FilterProvider` (contexto global `day`/`month`/`year`) no `__root`
- [x] Criar `DaySelector` (popover + Calendar pt-BR)
- [x] Criar `MonthSelector` (popover + stepper de ano + grid 3x4 de meses)
- [x] Header da home com os dois seletores à direita (padrão do botão de `/pedidos`)
- [x] Cards da home exibindo os rótulos dinâmicos dos filtros (dados ainda mock)

## Slice 3: Tipos TypeScript e Cliente HTTP ✅

- [x] Criar `src/types/index.ts` com interfaces de Pedido, Usuário, Feriado
- [x] ajuste a responsividade de `src/routes/index.tsx` mantendo o layout dos alinhamentos dos cards de dia e de mês perto dos seus popovers correspondentes.
- [x] Criar `src/services/api.ts` para chamadas HTTP contra o Apps Script (GET retorna array puro; POST com `?resource=`, `Content-Type: text/plain` para evitar preflight CORS; body `{ error }` vira `Error`)
- [x] Fetch inicial no root (últimos 500 pedidos + feriados + usuários) alimentando providers (`DataProvider` em `src/components/DataProvider.tsx`, fetch paralelo com `Promise.allSettled`)
- [x] Definir estratégia pós-POST: **re-fetch do recurso** via `refreshOrders`/`refreshHolidays`/`refreshUsers` do `useData()` (a API não retorna o objeto criado, e o POST já invalida o cache do GET)

## Slice 4: Dados reais na Home ✅

- [x] Funções puras de filtro/cálculo em `src/lib/` (`orders.ts` recebe `orders` + filtros; `dates.ts` com `toDateKey`/`nextBusinessDays`)
- [x] Ligar KPIs de dia/mês e lista "pedidos do dia" aos dados reais (cotas visuais: >15 pedidos/dia ou >100 peças/dia ficam âmbar — não é bloqueio)
- [x] Fins de semana e feriados destacados em cinza no `DaySelector` (sem bloqueio — bloqueio fica só no form de criação, Slice 5)
- [x] Gráfico "Status da Semana" (barras com divs Tailwind, próximos 7 dias úteis a partir de hoje, sem interação)

## Slice 5: Módulo de Pedidos ✅

- [x] remover badge de sistema online e Adicionar botão de trocar tema light/dark, salvando no local storage, ao lado do botão de tema fica o botão de escolher cor primária onde tem 6 cores disponíveis para escolha de cor primaria, (vermelho, laranja, amarelo, azul, verde, ou roxo), essa cor reflete nos botões e no gráfico area chart. (`ThemeProvider` + `data-primary` no `<html>`; controles no Header e no `ThemeControls`)
- [x] na tela de visualização da lista dos pedidos para o dia escolhido, usar uma tabela do shadcn bem bonita com os cabeçalhos: (nome do pedido, quant. camisetas, quant short/outros, data de encomenda) — `OrdersTable`, usado na home e em `/pedidos`
- [x] Substituir o gráfico de barras por um area chart do shadcn ui com seletor de próximos 3 dias, 7 dias ou 30 dias, aparecendo como um segmented control e duas linhas, uma para o número de camisetas e outra pro número de shorts/outros. (`ProductionChart` + recharts + `businessDaysBreakdown` em `lib/orders.ts`)
- [x] Seletor de dia com chevrons à esquerda/direita avançando ±1 dia (no lugar dos curly brackets)
- [x] Listagem real em `src/routes/pedidos.tsx` (busca client-side por pedido/vendedor; sort por `delivery_date`/`created_at` asc/desc; toggle lista/grade persistido em localStorage)
- [x] Form/modal "Novo Pedido" com seletor de data bloqueando fds/feriados (`NewOrderDialog`; vendedor = usuário ativo, sem campo no form)
- [x] form/modal "Adicionar Feriado" (`AddHolidayDialog`, disparado por `/feriados`)
- [x] form/modal "Adicionar Funcionário" (`AddUserDialog`, disparado pelo menu de usuário da sidebar)
- [x] Integrar criação (`POST /pedidos`) e atualização do snapshot local (refresh após POST nos 3 modais)
- [x] `UserProvider`: usuário ativo persistido em localStorage; footer da sidebar com popover (hovercard do usuário + lista lateral com check + botão adicionar usuário + botão configurações placeholder); KPIs mensais da home filtrados pelo usuário ativo (diários seguem globais)

## Slice 6: Feriados e Usuários ✅

- [x] Reescrever `/feriados`: toolbar (título à esquerda, search, toggle lista/grade persistido, botão Adicionar) + tabela/cards reais de `holidays` (data asc, destaque para "hoje") + `AddHolidayDialog` → `POST /feriados`
- [x] Dropdown de usuário ativo no footer da sidebar (lista de `Users`, sem auth) — entregue no Slice 5 (`UserMenu`)
- [x] Reposicionar o toggle da sidebar para o header da sidebar; no modo recolhido o logo "DT" vira o botão de expansão no hover (ícone `PanelLeftOpen`)
- [x] Exibir o cargo do usuário ao invés do e-mail no trigger e no hovercard do `UserMenu`
- [x] Corrigir erro Base UI "MenuGroupContext is missing" no menu de ordenação de `/pedidos` (itens envolvidos em `DropdownMenuGroup`)
- [x] Botão icon-only de criação rápida de pedido no Header (mesmo `NewOrderDialog`, disponível em qualquer tela)
- [x] KPIs mensais da home passam a filtrar por `created_at` (mês da encomenda/venda) — nova `ordersCreatedInMonth` em `lib/orders.ts`
- [x] `/pedidos` com carregamento incremental de 50 em 50 pedidos ("Carregar mais"), reiniciando ao mudar busca/ordenação
- [x] Providers centralizados em `src/contexts/index.tsx` (`AppProviders` — Theme → Tooltip → Sidebar → Filter → Data → User)

## Slice 7: Infraestrutura, PWA, Deploy e Ajustes Visuais Globais ✅

- [x] Adicionar arquivos de manifesto para PWA e vercel.json para redirecionamento SPA em subpáginas (ícones reais `icon-192.png`/`icon-512.png` no manifest + `<meta theme-color>` no `index.html`)
- [x] Fixar o header geral da aplicação no topo independentemente do scroll (`sticky top-0 z-10` no `Header`)
- [x] Destacar o nome do dia selecionado no KPI do dia com a cor primária atual (`dayLabel` envolto em `text-primary` em "Visão diária", "Pedidos para" e "Capacidade em")
- [x] Rodar `pnpm format` para corrigir estilo de import nos arquivos de registry

## Slice 8: Schema de Dados e Gestão de Imagens (Google Drive) ✅

- [x] Modificar o schema da planilha /pedidos para adicionar colunas `imgurl` e `is_done` (backend atualizado e deploy novo na URL do `.env`)
- [x] Adicionar campo opcional de URL de imagem do Google Drive no formulário de novo pedido (`NewOrderDialog`; envia `imgurl` só se preenchido)
- [x] Criar botão/ícone de link para imagem à esquerda do nome do pedido e modal de visualização nas tabelas diária e geral (`OrdersTable` + `lib/drive.ts` → `lh3.googleusercontent.com/d/<ID>`; botão **desabilitado** quando o pedido não tem imagem, em vez de placeholder clicável)

## Slice 9: Evolução das Tabelas, Filtros de Usuário e Ordenação por Colunas ✅

- [x] Ajustar default sort da tabela de pedidos para exibir `created_at` mais recente no topo por padrão (ambas as tabelas)
- [x] Adicionar sort embutido diretamente no header de todas as colunas em ambas as tabelas — dropdown de ordenação removido de `/pedidos`; datas comparam por timestamp (corrige "agrupamento por mês")
- [x] Modificar colunas exibidas na tabela de pedidos por dia (`is_done` checkbox, nome + ícone de imagem, vendedor, camisetas, outros, valor)
- [x] Ocultar pedidos com `is_done = true` na tabela diária e aplicar formatação riscada/esmaecida na tabela geral (lista e grade); checkbox chama `POST ?resource=update_order` com `{ id, is_done }` + refresh
- [x] Adicionar segmented control na tabela diária para alternar entre "Todos os Usuários" e "Usuário Ativo"
- [x] Exibir informações de valor vendido, camisetas e outras peças na tabela diária, integradas ao segmented control de usuário (linha de totais: pedidos · peças · R$)
- [x] Fix: rolagem horizontal da tabela em telas estreitas (`overflow-x-auto` no `OrdersTable`)

## Slice 10: Migração Supabase + Identidade Visual + Produtividade ✅

- [x] Setup Supabase: schema (profiles/orders/holidays), trigger handle_new_user, RLS + RPCs (complete_order, update_order, delete_order, admin_update_user, complete_onboarding), migrations 0001-0004
- [x] Auth no front: `AuthProvider` (sem race condition), `AuthGate`, rotas `/login` e `/onboarding` fora do shell, `SplashScreen`
- [x] Identidade visual: splash com `logodtex-animar.svg` animado (queda → squash → wordmark, loop 2s, mínimo 2s via `useSplashGate`), logo SVG no header da sidebar, PNGs novos para favicon/PWA, theme-color `#FF781F`
- [x] Roles: `designer` (somente leitura) adicionada; RLS/RPCs ajustados; UI esconde ações de escrita para designer
- [x] Admin: convite com escolha de role (Edge Function `invite-user`), gerenciador de usuários (role/is_active), KPIs mensais com segmented Todos/Somente eu
- [x] Pedidos: editar (mesmo modal) e excluir (com confirmação) por linha; linha inteira clicável abre imagem; datas de entrega com calendário abrindo no mês selecionado
- [x] Fetch escalonado: boot com pedidos do mês atual + futuros, histórico em background (listOrdersFrom + listOrders)
- [x] Calendários bloqueiam fds/feriados (home + form); botões "hoje" (CalendarArrowDown) e "dia de agendamento mais distante" (CalendarClock)
- [x] Hotkeys via react-hotkeys-hook: Ctrl/Cmd+K paleta de comandos (busca de pedidos com imagem clicável + ações), N novo pedido, S sidebar, H/P/F navegação; botão "Encontrar" no footer da sidebar
- [x] Remoção do legacy_id (migração de dados agora manual) e de `src/services/api.ts`/`VITE_API_URL`
- [x] Documentação atualizada (.agent/architecture.md, project-context.md, contexto da api.md marcado como legado)

## Pendências pós-migração ✅ (sistema em produção na branch main)

- [x] Deploy/validação da Edge Function `invite-user` em produção
- [x] Matriz de testes de RLS maliciosos (API direta como vendedor: alterar role, total_amount, user_id, delete)
- [ ] RPC `create_order` com validação de prazo no banco — ⚠️ **não implementada**: `createOrder` faz `.insert()` direto (`src/services/orders.ts:34`) e a constraint `orders_delivery_not_past` foi dropped em `0004_designer_admin_pedidos.sql:148`. **Decisão (08/10/2026): proteção contra data passada só no front por enquanto** (Slice 21, item C) — dívida consciente registrada na Slice 21
- [x] Migração manual dos dados históricos (substituir ids da planilha pelos uuids do Supabase)
- [x] Merge da branch e desligamento final do Apps Script
- [x] Chevrons do DaySelector navegam apenas por dias úteis (pula fds/feriados via shiftBusinessDay)
- [x] Lembrete de produção na home: junto de todo dayLabel aparece (2 dias úteis antes) — businessDaysBack em lib/dates; menor, entre parênteses, sem primary
- [x] Feriados: visão padrão em grade; tsconfig restrito a src + configs (tsc --noEmit limpo)

## Slice 11: Rota de Produção, production_date e UX ✅

- [x] Rota `/producao` + sidebar em dois blocos: "Acompanhamento" (Home + Produção) e "Cadastros" (Pedidos + Feriados) (`SidebarGroup` + `SidebarGroupLabel`)
- [x] `production_date` calculado no front (`productionDateOf`/`ordersForProductionDay` em `lib/orders.ts` = 2 dias úteis antes de `delivery_date`): coluna "Produção" nas tabelas; KPIs/lista do dia na home olham `production_date` e o hint exibe o `delivery_date` (`businessDaysForward` em `lib/dates.ts`)
- [x] `/producao`: base `created_at` (`ordersCreatedOnDay`), segmented Dia/Mês, DaySelector/MonthSelector globais; KPIs = **pedidos fechados** + valor vendido; vendedor/designer veem só a si mesmos; admin tem dropdown (DropdownMenu shadcn) de usuário; escopo default = usuário da sessão; tabela de pedidos do período abaixo dos KPIs
- [x] Segmented control dia/mês da home visível em todos os tamanhos de tela; ProductionChart só na visão mês; tabela do dia ocupa a largura toda na visão dia
- [x] `DateMaskInput` (DD/MM/AAAA, máscara automática, valida data real + fds/feriados) no DaySelector (dentro do popover) e no NewOrderDialog (ao lado do botão do calendário)
- [x] Colunas sticky: is_done (`left-0`) e ações edit/delete (`right-0`) no OrdersTable, com `bg-card`
- [x] Hotkey `D` → `/producao` + ação "Ir para Produção" na paleta
- [x] `OrderImageViewer` compartilhado: overlay limpo sem moldura/título, imagem ~70vh, fecha em clique fora/Esc, zoom por **clique na imagem** (1x ↔ 2.5x; ctrl+scroll descartado por conflitar com zoom da página); usado por OrdersTable e CommandPalette
- [x] Paleta de comandos: checkbox is_done (toggle otimista, readOnly p/ designer), vendedor antes do valor, botão follow (`ArrowUpRight`) → `/pedidos` com `search: { q: <nome do pedido> }` (busca por nome). **Corrigido em 16.7**: o `?focus=<id>` com scroll ao topo + highlight de 2s nunca foi implementado — o `highlightId` do `OrdersTable` era código morto e foi removido
- [x] Botão "dia de agendamento mais distante" agora calcula por `production_date` e só aparece na home (`DaySelector showLatestJump`; oculto em `/producao`)
- [x] DateMaskInput com autocomplete: digitar só o dia completa mês/ano da data do campo; dia+mês completa o ano; foco seleciona o texto todo (qualquer tecla recomeça o input)
- [x] Form de pedido: campo de data único — DateMaskInput como trigger do calendário (clique abre o calendário com o texto selecionado; digitação limpa e mascara)

## Slice 12: Responsividade, Tabelas Consistentes e Polling

- [x] Teto de largura nas colunas de texto (não largura fixa): nome do pedido `max-w-[30ch]` + truncate + `title` com nome completo no hover; vendedor cap ~14ch; feriado com cap; respiro à direita da coluna de nome; datas/números `whitespace-nowrap`. Tabela continua elástica (layout automático — estica quando há espaço)
- [x] Zero scroll horizontal de página: `min-w-0` na coluna de conteúdo, toolbars ok com flex responsivo; scroll lateral só dentro do wrapper da tabela (`overflow-x-auto`) em telas pequenas
- [x] Colunas sempre visíveis no scroll horizontal da tabela: is_done sticky à esquerda, ações (editar/excluir) sticky à direita (`bg-card`, z-index nos cantos)
- [x] Cabeçalhos de tabela sticky em `top-16` (colados abaixo do header do app) em todas as tabelas — base em `ui/table.tsx`; fix: wrapper do `Table` usa `overflow-x-auto lg:overflow-x-visible` (overflow no wrapper virava scrollport e o header cobria as primeiras linhas / não fixava na página)
- [x] Polling silencioso de dados a cada 5 min no DataProvider (pedidos + feriados + usuários), pausado em aba oculta, refresh imediato ao voltar à aba, erros só no console
- [x] Atualizar documentação `.agent` ao final do slice

## Slice 13: Layout view-height, mobile-first e modais

- [x] Desktop (lg+): sem scroll de página — shell `h-dvh`/`overflow-hidden`, `main` com `min-h-0`; toolbar/KPIs `shrink-0`, card da tabela `flex-1 min-h-0`, tabela rola internamente (header sticky passa a valer dentro do card). Abaixo de lg: scroll de página normal
- [x] Alturas estáveis nos cards KPI (estratégia híbrida): `invisible` para blocos compostos (ícone + texto), `'&nbsp;'` para linhas simples — card nunca muda de altura
- [x] Home: top bar unificada (estilo /producao) — segmented Dia/Mês à esquerda; à direita: UM controle global Todos/Eu (só admin) + DaySelector/MonthSelector; remove segmented centralizado e os controles antigos
- [x] Mobile: `KpiPair` — par de cards vira carrossel com peek (~85%, scroll snap, bolinhas via onScroll) abaixo de sm; sm+ grid 2 colunas. Home (dia/mês) e /producao
- [x] Header mobile: logo-button = trigger da sidebar, título centralizado, só "+" à direita; cor/tema vão para o UserMenu (só <lg); desktop inalterado
- [x] Sidebar mobile: clique em rota recolhe a Sheet e navega
- [x] /producao mobile: linha 1 segmented (esq) + dropdown escopo (dir); linha 2 seletor centralizado
- [x] Novo Pedido: dica sob a data = "A produção da fábrica será dia {dd/mm}" (businessDaysBack)
- [x] Todos os Dialogs a ~20% do topo (`top-[20%]`, sem overflow no DialogContent — overflow clipava conteúdo ancorado)
- [x] Fix: calendário do Novo Pedido flutua PARA FORA do modal — painel `fixed` ancorado via `getBoundingClientRect` do campo de data (recalcula no resize; z-60 acima do modal; backdrop fecha; mousedown sem roubar foco)
- [x] Fix mobile: nenhum calendário abre o teclado virtual — hook `useIsTouch` (`pointer: coarse`); `DateMaskInput` vira `readOnly` no touch (seleção só por toque); popover do `DaySelector` esconde o input mascarado no touch
- [x] Fix: calendário do Novo Pedido ancorado ao input via CSS (`absolute`; abaixo no desktop, acima no mobile via `useIsMobile`) — substitui a âncora fixed/getBoundingClientRect que errava a posição durante a animação do modal
- [x] Home mobile: top bar em 2 linhas como /producao — linha 1: segmented Dia/Mês (esq) + Todos/Eu (dir, admin); linha 2: seletor centralizado
- [x] Feriados mobile (grade): cards com cap de caracteres + truncate + title, caixa ajustada ao padding do pai sem estourar (min-w-0/overflow-hidden)
- [x] Scrollbars slim temáticas (styles.css): `color-scheme: dark` no bloco `.dark` + `::-webkit-scrollbar` slim com tokens do tema (--border no light quase invisível, --muted no dark, hover --muted-foreground, trilha transparente); Firefox via `scrollbar-width: thin` + `scrollbar-color`
- [x] Calendário do Novo Pedido com o mesmo visual do popover do DaySelector — painel com as classes do PopoverContent (ring suave, shadow-md, fade/zoom) + `data-slot="popover-content"` (ativa o fundo transparente do ui/calendar); âncora CSS mantida (abaixo no desktop, acima no mobile)
- [x] Atualizar docs .agent

## Slice 14: Persistência, calendário, precedência de loading e hover da sidebar

> **Regra de execução:** ao concluir cada item, sugerir a mensagem de commit e **aguardar confirmação** antes de commitar e passar para o próximo item. Ao final do slice, atualizar a documentação `.agent`.

### 14.1 Estado da sidebar em localStorage (desktop)

- [x] `ui/sidebar.tsx`: trocar o cookie `sidebar_state` (gravado em `setOpen` e nunca lido) por `localStorage`, com inicializador preguiçoso no `useState` para o primeiro paint já respeitar o valor (sem flash abrir/fechar); `openMobile` (Sheet no mobile) fica intacto
- [x] Aceite: recolher → F5 → continua recolhida; mobile inalterado

### 14.2 Sábado selecionável apenas em /producao

> Contexto: em `/producao` a base é `created_at` — a loja cria pedido no sábado, mas não agenda entrega nele. Por isso só essa rota pode alcançar sábado; em nenhum outro lugar.

- [x] `lib/dates.ts`: helper de navegação parametrizado (`shiftSelectableDay`) — pula domingo/feriado sempre; sábado só quando liberado. `shiftBusinessDay`, `nextBusinessDays`, `businessDaysBack/Forward` **não mudam**
- [x] `DaySelector`: `useAllowSaturday()` hook → matcher do `Calendar` bloqueia só domingo; `DateMaskInput`: mesma prop no `commit()` (hoje rejeita `getDay() === 0 || 6`)
- [x] Chevrons do `DaySelector` e hotkeys ←/→ (`GlobalHotkeys`) usam o mesmo caminho, com fonte única de verdade (`useLocation().pathname === '/producao'`)
- [x] **Não tocar**: calendário do `NewOrderDialog` (entrega não pode ser agendada no sábado), `productionDateOf` (`lib/orders.ts`) e o gráfico `businessDaysBreakdown` — evita deslocar a data de produção dos pedidos já cadastrados
- [x] Aceite: sábado alcançável em /producao (calendário, input mascarado, chevrons, setas); bloqueado na home, no novo pedido e nas demais telas; domingo e feriado bloqueados em toda parte

### 14.3 Precedência do is_loading — splash sempre como primeira pintura

> Sintoma: às vezes uma parte da interface aparece antes da animação da splash.

- [x] `index.html`: CSS crítico inline (fundo escuro `#0a0a0a` + altura 100%) + script inline aplicando `.dark` do localStorage antes da montagem do React (hoje o tema só é aplicado em `useEffect`, gerando flash light→dark)
- [x] `src/components/SplashGateProvider.tsx`: **novo** gate global (singleton) — timer de 2s iniciado uma vez no boot da aba, não reinicia em navegação
- [x] `src/contexts/index.tsx`: injeta `SplashGateProvider` no topo dos providers (cobre `/login`, `/onboarding`, shell autenticado)
- [x] `AuthGate.tsx`, `login.tsx`, `onboarding.tsx`: usam `useSplashGate()` sem argumento (import do novo provider)
- [x] **Não feito** (defensivo): `defaultPendingComponent` no router — nenhuma rota tem loader hoje, zero efeito; pode ser adicionado depois se houver loaders
- [x] Aceite: F5 em qualquer rota mostra a splash primeiro, sem flash branco/escuro, e navegar (ex.: `/onboarding` → `/`) **não** reexibe a splash

### 14.4 Hover do ícone Produção com a sidebar recolhida

- [x] `ui/sidebar.tsx` `SidebarGroupLabel`: `group-data-[collapsible=icon]:pointer-events-none` — no estado recolhido o label ficava `opacity-0` + `-mt-8` (invisível, porém ainda no hit-test) e sobrepunha o último item do grupo anterior (Produção), deixando o clique funcionando só em 1 pixel
- [x] Aceite: com a sidebar recolhida, hover e clique funcionam na área toda do botão

## Slice 15: Nova rota /calendario — Calendário de Produção

- [x] **Commit 1:** `feat: add production calendar route + nav` — `calendario.tsx`, `AppSidebar.tsx`, `Header.tsx`, `CommandPalette.tsx`, `routeTree.gen.ts`
- [x] **Commit 2:** `feat: add production calendar domain logic` — `lib/production-calendar.ts`, `lib/production-calendar.test.ts` (25 testes)
- [x] **Commit 3:** `feat: add production calendar hook` — `hooks/use-production-calendar.ts` (estado + localStorage + reset ao entrar)
- [x] **Commit 4:** `feat: add monthly production calendar view` — `ProductionCalendarMonth`, `ProductionCalendarToolbar`, `ProductionCalendar`, `MonthSelector` controlado
- [x] **Commit 5:** `feat: add 3/7 day production calendar views` — `ProductionCalendarDays`, `ProductionCalendarOrder` (compartilhado)
- [x] **Commit 6:** `feat: add calendar interactions + image/follow` — integração `OrderImageViewer`, follow link
- [x] **Commit 7:** `feat: add keyboard nav + responsive + polish` — `CalendarNavigationContext`, `GlobalHotkeys` rota-aware, `C` para abrir calendário

## Slice 16: Refinamentos visuais e UX do Calendário de Produção ✅

### 16.1 Ajustes visuais do grid mensal

- [x] **Remover contorno (ring) do dia atual** na visão de mês (`today && 'ring-2 ring-primary'` removido)
- [x] **Box com cor primária no dia atual**: substituir ring por `bg-primary/10` + `text-primary` no número do dia (cor igual ao botão "Novo pedido" em /pedidos — `text-primary` no `variant="outline"`)
- [x] **4 cantos arredondados na box do calendário**: container do grid com `rounded-xl bg-card`; células de borda com `rounded-tl/tr/bl/br-xl` conforme posição

### 16.2 Visões 3 e 7 dias — cards de largura total

- [x] **Cards expandem para largura máxima**: remover `max-w-[320px]` em `ProductionCalendarDays.tsx:41`, usar `flex-1 min-w-0`
- [x] **Altura fixa do calendário / limite do padding bottom**: container principal (`ProductionCalendar.tsx`) com altura estável igual às outras rotas — `h-full min-h-0` + conteúdo com `overflow-auto` interno; não ultrapassar `pb-8`
- [x] **Consistência com padding das outras rotas**: verificar `p-4 sm:p-6 lg:p-8` no `__root.tsx:41`

### 16.3 Toolbar e Segmented Control — paridade visual

- [x] **Toolbar idêntica a /producao e /**:
  - Container: `rounded-xl border border-border bg-card p-4 shadow-sm`
  - Segmented "Todos / Somente eu" com mesmo estilo do day/month de /producao
  - Dropdown "Mês / 7 dias / 3 dias" com mesmo estilo do dropdown de escopo de /producao
  - MonthSelector alinhado visualmente (gap, padding)
- [x] **Responsividade mobile em 2 linhas** igual Home/Produção (segmented + dropdown esq., month selector dir. na linha 1; linha 2: month selector)

### 16.4 Interações e ícones

- [x] **Hover no botão "expandir" (CalendarClock)**: `hover:bg-accent cursor-pointer transition-colors` (padrão botões ghost/icon)
- [x] **Hover no follow link (ArrowUpRight)**: `opacity-0 group-hover:opacity-100 hover:text-primary rounded p-1 transition-opacity transition-colors`
- [x] **Ícone de imagem com cor primária**: substituir 📎 por `<FileText className="h-3.5 w-3.5 text-primary" />` de `lucide-react` em `ProductionCalendarOrder.tsx`

### 16.5 Lógica de origem padrão ao alternar visão

- [x] **No hook `useProductionCalendar`**: `setView(v, anchor?)` normaliza a âncora ao trocar a visão via dropdown (`normalizeAnchorForView` em `lib/production-calendar.ts`): visão mês → 1º dia do mês da âncora; 3/7 dias → hoje se a âncora estiver no mês atual, senão 1º dia do mês. Não normaliza quando a opção escolhida já é a atual; `anchor` explícito tem prioridade (usado pelo ícone "expandir" da grade, `setView('3-days', day)`)
- [x] ~~Persistir `anchorDate` no localStorage~~ — **descartado de propósito**: o hook reseta view/scope/âncora ao entrar em `/calendario`, então persistir a âncora não teria efeito. Nenhuma chave nova foi criada
- [x] 6 testes novos em `lib/production-calendar.test.ts` (31 no total)

### 16.6 Altura consistente do calendário

- [x] **Container** `flex flex-col h-full min-h-0` (herda o `<main>` em `__root.tsx:41`) — wrapper duplicado removido de `calendario.tsx`; a raiz do `ProductionCalendar` já é o container
- [x] **Toolbar** `shrink-0` (já existia), **conteúdo** `relative flex min-h-0 flex-1 flex-col overflow-auto` — **coluna flex**: é o que permite os filhos esticarem até a base. Antes (block) o `flex-1` dos filhos era inerte e o calendário ficava curto, sem chegar ao rodapé
- [x] Sem overflow vertical da página: `min-h-[360px]` na **raiz** da grade mensal (no card, o `overflow-hidden` cortaria a última semana; na raiz o card inteiro estoura e o wrapper rola), cabeçalho de dias da semana e cabeçalho de cada coluna com `shrink-0`, listas das colunas 3/7 dias com `overflow-y-auto` próprio
- [x] Cards das visões 3/7 dias também preenchem até a base: `p-4` removido do container de dias (só o `gap-3` separa as colunas)

### 16.7 Navegação de período e limpeza

- [x] **Toolbar** com o grupo `[hoje] ‹ [período] ›`: botão "hoje" (`CalendarArrowDown` + tooltip, desabilitado quando já está no período atual), chevrons `goPrev`/`goNext` e o `MonthSelector` no meio exibindo o `periodLabel` (nova prop opcional `label`; sem ela o componente se comporta como antes)
- [x] **Visão 3 dias passou a navegar** (±3 dias) via `navigateDays` em `lib/production-calendar.ts` — sem isso os chevrons ficariam mortos nessa visão. 3 testes novos (34 no total)
- [x] **Hotkeys `←`/`→` removidos de `/calendario`** (no-op pelo `pathname`); `CalendarNavigationContext.tsx` deletado — nunca funcionou, porque `GlobalHotkeys` é montado no `__root.tsx`, fora do provider, então `useCalendarNavigation()` devolvia `null` e o handler caía no `setDay()` global
- [x] **Código morto removido**: `users`/`canWrite` no `ProductionCalendar`, `weeks`/`i` no mês, imports `Tooltip*` nos dias, prop `highlightId` do `OrdersTable` (nunca implementada — a paleta busca por nome, `search: { q }`), `isLoading` em `AuthGate`/`login`/`onboarding`, `navigate` em `/pedidos`, `viewLabels` duplicado na toolbar
- [x] **Tipagem**: `navigate({ to: '/pedidos' })` → `search: { q: undefined }` (o `validateSearch` devolve `q` obrigatório, então `search: {}` não compila)
- [x] **DRO (deuda técnica) paga**: `tsc --noEmit` de 17 erros → **0**; `pnpm lint` de 3 erros → **0** (restam 7 warnings `no-shadow` preexistentes em `ui/calendar.tsx`/`ui/chart.tsx`); `prettier --check src .agent` limpo
- [x] **Validação visual do usuário** em `lg+` e abaixo de `lg` (aceita em 08/10/2026)

---

### Commits sugeridos (5)

| #   | Mensagem                                                                     | Escopo                                                 |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `feat: month grid visual polish — today box, rounded corners, no ring`       | `ProductionCalendarMonth.tsx`                          |
| 2   | `feat: 3/7 day views full-width cards + fixed height`                        | `ProductionCalendarDays.tsx`, `ProductionCalendar.tsx` |
| 3   | `feat: toolbar parity with /producao — segmented, dropdown, responsive`      | `ProductionCalendarToolbar.tsx`                        |
| 4   | `feat: order card interactions — hover expand/follow, primary FileText icon` | `ProductionCalendarOrder.tsx`                          |
| 5   | `feat: smart anchorDate on view switch + height consistency`                 | `use-production-calendar.ts`, `ProductionCalendar.tsx` |

## Slice 17: Framer Motion + Checkbox is_done nas views 7/3 dias + Animação de saída ✅

> **Dependência:** `pnpm add framer-motion`

### 17.1 Instalar Framer Motion

- [x] `pnpm add framer-motion` (13.4.4)

### 17.2 Checkbox de conclusão nas views 7/3 dias (`ProductionCalendarOrder` variant="card")

- [x] Extrair `OrderDoneCheckbox` para `src/components/OrderDoneCheckbox.tsx`, compartilhado com `OrdersTable` (em vez de um `CalendarOrderDoneCheckbox` paralelo), consumindo `useData().toggleOrderDone` e `useAuth().profile` (readOnly para designer)
- [x] Em `ProductionCalendarOrder.tsx`, renderizar checkbox à esquerda do nome, com `after:hidden` — senão a área de clique ampliada do checkbox invade ícone e nome
- [x] `onCheckedChange` chama `toggleOrderDone(order.id, checked)` → atualização otimista via `DataProvider` remove o item do `grouped` (já filtra `is_done=true`)
- [x] Testar: marcar/desmarcar em 7-dias e 3-dias, verificar rollback em erro — validação manual (aceita em 08/10/2026)

### 17.3 Animação de desaparecimento (exit) nas views 7/3 dias

- [x] Em `ProductionCalendarDays.tsx`: envolver `.map()` dos pedidos com `<AnimatePresence>` do Framer Motion
- [x] Em `ProductionCalendarOrder.tsx`: envolver card em `<motion.div>` com `initial={{opacity:0, height:0}}`, `animate={{opacity:1, height:'auto'}}`, `exit={{opacity:0, height:0, x:-20}}`
- [x] A animação de saída ocorre antes da remoção do DOM (quando `toggleOrderDone` atualiza o estado e o item sai do `grouped`)
- [x] O estado vazio entra no `AnimatePresence` (key `"empty"`) para concluir o ÚLTIMO pedido ainda rodar a saída do card
- [x] `key={days[0]?.getTime()}` no `AnimatePresence`: navegar de período remonta a lista (troca instantânea), sem animar

**Commits sugeridos:**

| #   | Mensagem                                                  | Escopo                                                      |
| --- | --------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `feat: add framer-motion dependency`                      | `package.json`                                              |
| 2   | `feat(calendario): checkbox is_done nas views 7/3 dias`   | `ProductionCalendarOrder.tsx`, `ProductionCalendarDays.tsx` |
| 3   | `feat(calendario): animate exit order card on completion` | `ProductionCalendarOrder.tsx`, `ProductionCalendarDays.tsx` |

---

## Slice 18: Visão mensal — botão contador + follow link mobile ✅

### 18.1 Botão contador de pedidos por dia (substitui lista de até 3 + botão expandir)

- [x] Em `ProductionCalendarMonth.tsx`: remover lógica `hasMore` / `visibleOrders.slice(0,3)` / `CalendarClock` (linhas ~62-63, 97-121)
- [x] Substituir área de pedidos por botão único quando `dayOrders.length > 0`:
  - Label: `{n} pedido pendente` / `{n} pedidos pendentes` (o `grouped` já descarta `is_done`)
  - `onClick` → `onExpandDay(day)` (navega para visão 3 dias a partir desse dia)
  - Estilo: `w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors`
  - Tooltip + `aria-label`: "Ver todos os N pedidos pendentes" ("Ver o pedido pendente" no singular)
- [x] Dias sem pedidos ficam vazios (sem botão)

### 18.2 Follow link na visão mensal (mobile/tablet) — substitui CalendarClock

- [x] Descartada: o botão contador já é o atalho para a visão de 3 dias, então um segundo botão no mesmo dia duplicaria a ação sem ganho

**Commits sugeridos:**

| #   | Mensagem                                                                      | Escopo                        |
| --- | ----------------------------------------------------------------------------- | ----------------------------- |
| 1   | `feat(calendario): month view — counter button per day, remove expand button` | `ProductionCalendarMonth.tsx` |
| 2   | `feat(calendario): month view mobile — follow link to 3-days view`            | `ProductionCalendarMonth.tsx` |

---

## Slice 19: Animação /home — movimentação pendente ↔ concluído (Framer Motion) ✅

### 19.1 Animação de linhas na tabela do dia (variant="day")

- [x] Em `OrdersTable.tsx`: `AnimatedTableRow` (wrapper local) renderiza `motion.tr` com `layout="position"`, replicando as classes do `TableRow` do registry — o `TableRow` emite um `<tr>` fixo e não aceita virar `motion.tr`
- [x] `Row = variant === 'day' ? AnimatedTableRow : TableRow` — o `variant="full"` não paga medição de layout, já que a ordenação é única e a posição nunca muda
- [x] Como `OrdersTable` já separa `pendingOrders` + `doneOrders` e concatena (`[...pendingOrders, ...doneOrders]`), a mudança de `is_done` move o item entre arrays → `layout` anima automaticamente
- [x] `layout="position"` em vez de `layout`: só a posição muda, e sem `scale` na distorção
- [x] A alternativa com `motion.tbody` + `display: contents` não foi necessária
- [x] Testar: marcar pedido como concluído → desce para seção de concluídos; desmarcar → sobe — validação manual (aceita em 08/10/2026)

**Commits sugeridos:**

| #   | Mensagem                                                           | Escopo                         |
| --- | ------------------------------------------------------------------ | ------------------------------ |
| 1   | `feat(home): animate order row move between pending/done sections` | `OrdersTable.tsx`, `index.tsx` |

---

## Slice 20: Mobile/Tablet — scroll horizontal interno + largura mínima nos cards ✅

### 20.1 ProductionCalendarDays — container com scroll horizontal + cards min-width fixo

- [x] Container já tem `overflow-x-auto` — garantido `flex gap-3` (não wrap)
- [x] Cada card (dia): `flex flex-col flex-1 min-w-[300px] bg-card rounded-xl border border-border overflow-hidden` — sem `w-[300px]` fixo, para o card continuar dividindo a largura toda no desktop
- [x] Scroll horizontal arrasta **todos os cards juntos** (um único scrollport no container)

### 20.2 ProductionCalendarMonth — mobile/tablet: grid → flex com scroll ou minmax

- [x] Opção A descartada: viraria o mês numa fileira de células, perdendo a semântica de grade
- [x] Opção B escolhida: grade `grid-cols-7` mantida, com um único scrollport no wrapper do card (`overflow-x-auto`) e piso de `min-w-[840px]` no card (7 × 120px) — equivale a `repeat(7, minmax(120px, 1fr))` e mantém cabeçalho e células na mesma template
- [x] Cabeçalho dos dias da semana e grade no mesmo scrollport: as colunas não desalinham ao arrastar
- [x] `lg:overflow-visible` no scrollport — em CSS `overflow-x: auto` força `overflow-y: auto`; acima de lg a grade cabe na tela, então o estouro vertical (janela baixa) continua rolando no contêiner externo, sem scroll aninhado
- [x] Testar alinhamento cabeçalho × colunas e o piso de 120px no celular — validação manual (aceita em 08/10/2026)

**Commits sugeridos:**

| #   | Mensagem                                                            | Escopo                        |
| --- | ------------------------------------------------------------------- | ----------------------------- |
| 1   | `feat(calendario): 3/7 days horizontal scroll with min-width cards` | `ProductionCalendarDays.tsx`  |
| 2   | `feat(calendario): month view mobile horizontal scroll`             | `ProductionCalendarMonth.tsx` |

---

## Slice 21: Dias úteis na home + UX do modal de pedido ✅

> **Regra de execução (pedido do usuário):** ao concluir cada item, sugerir a mensagem de commit e **aguardar a confirmação do usuário de que o commit foi feito** antes de avançar para o próximo item. Ao final da slice, atualizar a documentação `.agent`.

### Decisões confirmadas (08/10/2026)

| Tema                        | Decisão                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Mensagem no `/home`         | **substitui** a linha `Visão diária {dayLabel} ({entrega}).` (mantém o hint de entrega entre parênteses) |
| Onde exibir no modal        | duas linhas **logo abaixo** do `"A produção da fábrica será dia X."`                                     |
| Base dos números no modal   | `delivery_date` (a home continua em `production_date`)                                                   |
| O que contar no modal       | **peças totais** = camisetas + shorts/outros (`sumPieces`)                                               |
| Bloqueio de data no passado | **somente na criação** — editar pedido antigo continua aceitando data passada                            |
| Proteção no banco           | **fora de escopo** — só front por enquanto (dívida consciente, ver "Fora de escopo" abaixo)              |

### Semântica da contagem (regra travada por teste)

`getBusinessDaysUntil` conta dias úteis na janela **`(hoje, dataSelecionada]`** — exclui hoje, inclui a data selecionada se ela for útil; ignora sábado, domingo e feriado.

> A tabela de referência da planejação trazia `10/10 sábado → 1 dia útil`, o que não fecha com essa regra (daria 2). Como **/home bloqueia fds e feriados no `DaySelector`**, o caso é inalcançável na prática — implementar a regra acima e cobri-la com teste.

### 21.1 `getBusinessDaysUntil` em `src/lib/dates.ts`

- [x] Novo type no próprio `dates.ts` (sem arquivo novo — decisão do usuário):

```ts
export type BusinessDaysResult =
  | { type: 'past' }
  | { type: 'today' }
  | { type: 'future'; businessDays: number }

export function getBusinessDaysUntil(
  date: Date,
  holidays: Array<Holiday>,
  today: Date = new Date(), // injetável → testes determinísticos
): BusinessDaysResult
```

- [x] Normalizar `date` e `today` para meia-noite local antes de comparar (o `day` do `FilterProvider` carrega a hora do boot — `src/components/FilterProvider.tsx:16`); comparar por timestamp (`getTime()`), não por string.
- [x] Se `date < today` → `{ type: 'past' }`; se igual → `{ type: 'today' }`; senão loop dia a dia de `today` até `date` somando dias úteis (`isWeekend` + `Set` de `holidayKeys` via `toDateKey`).
- [x] Manter a mesma convenção do módulo: `holidays: Array<Holiday>` (mesma assinatura de `shiftBusinessDay`/`businessDaysBack`).
- [x] **Testes** em `src/lib/dates.test.ts` — `describe('getBusinessDaysUntil')`, com `today` injetado (~10 casos): data passada → `past`; hoje → `today`; amanhã útil → `1`; dois dias úteis à frente → `2`; atravessando fds (sex→seg); atravessando feriado; data-alvo em fds (conta só até o último útil); data-alvo em feriado; virada de mês; virada de ano.

```text
feat(dates): getBusinessDaysUntil com estados past/today/future
```

### 21.2 Mensagem no `/home` — `src/routes/index.tsx:186-193`

- [x] Substituir o parágrafo `Visão diária {dayLabel} ({deliveryDayLabel}).` pelo resultado de `getBusinessDaysUntil(day, holidays)`, mantendo as classes atuais (`text-muted-foreground`, data/`hoje` em `font-medium text-primary`) e o hint de entrega.
- [x] Só no branch `activeTab === 'day'` — o branch mês (`Acompanhamento mensal …`) não muda.
- [x] Copy exata (a interface monta o texto; `lib` só devolve o resultado estruturado):

| Caso     | Texto                                                                    |
| -------- | ------------------------------------------------------------------------ |
| passado  | `Visão diária para {dayLabel} ({entrega}). essa data já passou.`         |
| hoje     | `Visão diária para hoje ({entrega}). aqui estão os pedidos pra hoje.`    |
| futuro 1 | `Visão diária para {dayLabel} ({entrega}). 1 dia útil de distância.`     |
| futuro n | `Visão diária para {dayLabel} ({entrega}). {n} dias úteis de distância.` |

```text
feat(home): distância em dias úteis na visão diária
```

### 21.3 Bloqueio de data passada na criação

- [x] `src/components/NewOrderDialog.tsx:314` — no `disabled` do `Calendar`, adicionar o matcher `{ before: <hoje em meia-noite> }` **apenas quando `!isEdit`** (em edição o picker continua livre).
- [x] `src/components/DateMaskInput.tsx` — nova prop opcional `disallowPast?: boolean` (padrão `false` → o `DaySelector` da home segue aceitando data passada para ver histórico). Em `commit()`, após validar a data real e **antes** da checagem de fds/feriado: se `disallowPast` e `parsed < hoje` → `toast.error('A data de entrega não pode estar no passado.')` + `setText(toMask(date))` e retorna.
- [x] `NewOrderDialog.tsx` `handleSubmit` (~linha 111) — guarda de defesa, **só `!isEdit`**: `toDateKey(deliveryDate) < toDateKey(new Date())` → `setError('A data de entrega não pode estar no passado.')` e não submete.
- [x] Sem mudança no banco (decisão 08/10/2026 — ver "Fora de escopo").

```text
feat(pedido): bloquear data no passado na criação
```

### 21.4 Resumo no modal — duas linhas abaixo do hint de produção

**Arquivo:** `src/components/NewOrderDialog.tsx` (hoje só `holidays, refreshOrders` no `useData()` — linha 61; adicionar `orders`).

- [x] `src/lib/orders.ts`: **exportar** o `ordersForDay` privado (linha 29) renomeando para `ordersDeliveredOnDay` — fecha a tríade de nomes já documentada no comentário de convenção (`ordersForProductionDay` = produção, `ordersCreatedOnDay` = created_at, `ordersDeliveredOnDay` = entrega). Atualizar o uso interno em `businessDaysBreakdown` (linha 113) e o comentário.
- [x] Bloco `<div className="space-y-1">` com as duas linhas em `text-xs text-muted-foreground`, imediatamente **depois** do `<p>` "A produção da fábrica será dia {dd/mm}.":

| Linha | Conteúdo                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| 1     | `{n} pedidos · {m} peças` (`sumPieces` dos pedidos com `delivery_date` do dia); `n = 0` → `Nenhum pedido para este dia.` |
| 2     | resultado de `getBusinessDaysUntil(deliveryDate, holidays)` (ver copy abaixo)                                            |

| Estado   | Texto da linha 2                                  |
| -------- | ------------------------------------------------- |
| passado  | `Esta data já passou.` (só faz sentido em edição) |
| hoje     | `Esta data é hoje.`                               |
| futuro 1 | `Faltam 1 dia útil até a entrega.`                |
| futuro n | `Faltam {n} dias úteis até a entrega.`            |

- [x] **Testes** em `src/lib/orders.test.ts`: `describe('ordersDeliveredOnDay')` — filtra por `delivery_date` (ignora hora/ISO), devolve lista vazia quando não há pedidos no dia.

```text
feat(pedido): resumo de pedidos/peças e dias úteis no modal
```

### 21.5 Recolher o calendário ao pressionar Tab

**Arquivo:** `src/components/NewOrderDialog.tsx:262-276` (o wrapper `div.relative` já trata `Escape`).

- [x] Em `onKeyDown`: `e.key === 'Tab'` → `e.preventDefault()`, `setCalendarOpen(false)` e mover o foco explicitamente.
- [x] **Por que `preventDefault`:** o `DayPicker` sempre deixa um dia com `tabIndex=0` (`isFocusTarget` em `react-day-picker/dist/esm/useFocus.js`), então o Tab nativo entraria no grid; se o grid desmontar depois, o foco cai no `body` e o próximo Tab recomeça do topo do dialog.
- [x] Helper local `focusSibling(input, +1 | -1)`: pega `input.closest('form')`, lista os focáveis (`input, button, select, textarea, a[href]` habilitados), encontra o índice do input de data e foca o vizinho. Shift+Tab fecha e volta para o campo "Imagem do pedido".
- [x] O calendário continua **abrindo** ao entrar no campo pelo Tab (`onFocus` do wrapper não muda) — só o segundo Tab recolhe.

```text
feat(pedido): fechar calendário no Tab com foco explícito
```

### 21.6 Documentação e housekeeping (ao final da slice)

- [x] Fechar os itens abertos aceitos em 08/10/2026 (feito nesta sessão): Slice 16.7 validação visual, 17.2, 19.1 e 20.2 — marcados ✅.
- [x] `src/lib/dates.test.ts` / `orders.test.ts` novos → total de testes sobe (85 → **100**).
- [x] Commitar o `package.json` solto (script `test:watch`).
- [x] Ao terminar os itens 21.1–21.5: marcar esta slice ✅ e atualizar `project-context.md` + `architecture.md` com as funcionalidades novas.

**Commits sugeridos (6):**

| #   | Mensagem                                                          | Escopo                                                      |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `feat(dates): getBusinessDaysUntil com estados past/today/future` | `src/lib/dates.ts`, `src/lib/dates.test.ts`                 |
| 2   | `feat(home): distância em dias úteis na visão diária`             | `src/routes/index.tsx`                                      |
| 3   | `feat(pedido): bloquear data no passado na criação`               | `src/components/NewOrderDialog.tsx`, `DateMaskInput.tsx`    |
| 4   | `feat(pedido): resumo de pedidos/peças e dias úteis no modal`     | `NewOrderDialog.tsx`, `src/lib/orders.ts`, `orders.test.ts` |
| 5   | `feat(pedido): fechar calendário no Tab com foco explícito`       | `src/components/NewOrderDialog.tsx`                         |
| 6   | `docs(agenda): fechar Slice 21 e registrar decisões`              | `.agent/*`                                                  |

**Status de execução:** commits 1–5 efetuados em 08/10/2026 (cada commit confirmado pelo usuário antes de avançar); o commit 6 (este registro) inclui o fechamento da slice e das docs. O `package.json` (`test:watch`) já havia sido commitado no `plan` `11e44ce`.

**Verificação após cada item:** `npx tsc --noEmit` · `pnpm lint` · `pnpm test` · `pnpm check`.

### Fora de escopo (decisão consciente de 08/10/2026)

- **Proteção contra data passada no banco:** não será feita nesta slice. Hoje **não existe** nenhuma trava server-side — `createOrder` faz `.insert()` direto (`src/services/orders.ts:34`) e a constraint `orders_delivery_not_past` foi dropped em `0004_designer_admin_pedidos.sql:148` (ela quebraria a edição de pedidos antigos). Se um dia for feita, o caminho é RPC `create_order` validando `delivery_date >= current_date` **no INSERT** (não recriar a check constraint).
- Nada muda em `/pedidos`, `/producao` e `/calendario`; o `DaySelector` da home segue aceitando datas passadas (histórico).

---

## Slice 22: Impressão de `/producao` — Ctrl+P com tabela completa em A4 ⏳ PLANEJADA

> **Status:** adicionada ao backlog em 08/10/2026 — **não implementada**. Aguardando a confirmação do usuário para iniciar.
> **Regra de execução (a valer quando implementar):** ao concluir cada item, sugerir a mensagem de commit e **aguardar a confirmação** de que o commit foi feito antes de avançar; ao final, atualizar as docs `.agent`.

### Requisito

Ao pressionar **Ctrl+P** em `/producao`, imprimir **somente** a tabela de pedidos **por completo** + um cabeçalho resumido. Vale para a visão de **dia** ou **mês**. A tabela sempre ocupa a **largura total da folha A4**; se o conteúdo ficar maior verticalmente, a impressão **se divide em duas (ou mais) folhas**.

### Decisões confirmadas (08/10/2026)

| Tema                  | Decisão                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabeçalho impresso    | `Produção — {periodLabel}` (título) + linha `Vendedor: {scopeName} · {N} peças · {formatBRL(revenue)} vendidos` — renderizado só na impressão (`hidden print:block`)       |
| Colunas impressas     | **Todas as de conteúdo** — Nome, Vendedor, Camisetas, Shorts/Outros, Encomendado em, Produção, Entrega, Valor                                                              |
| Esconder na impressão | checkbox (`is_done`), ações editar/excluir e ícone de imagem por linha (`print:hidden`); no shell, sidebar + header; na página, toolbar, subtítulo, KPIs e h3/sub da seção |
| Folha                 | `@page { size: A4 portrait }` + margens padrão; tabela `w-full`; a divisão em várias folhas é natural do `table` quando o corte/overflow é anulado                         |
| Abordagem             | **Sem JS** — Ctrl+P é nativo do navegador → só CSS (`@media print` + variantes `print:` do Tailwind v4)                                                                    |

### 22.1 `src/styles.css` — base de impressão

- [ ] `@page { size: A4 portrait; margin: 12mm; }`.
- [ ] Bloco `@media print`: `html, body, #app { height: auto !important; overflow: visible !important; }` — anula o shell `lg:h-dvh lg:overflow-hidden` e os scrollports internos que clipariam a impressão numa única página.
- [ ] `thead { display: table-header-group; }` — o cabeçalho da tabela repete no topo das folhas seguintes.
- [ ] `tr { break-inside: avoid; }` — a quebra de página acontece só entre linhas.
- [ ] Largura total + tipografia de impressão via `[data-slot="table"]` (fonte/padding menores) para caber nos ~190mm úteis do A4.

### 22.2 `src/routes/__root.tsx` — esconder o shell na impressão

- [ ] Envolver `<AppSidebar />` e `<Header />` em `div print:hidden` (os componentes não aceitam className).
- [ ] Container flex (`:36`): `print:h-auto print:overflow-visible`; `<main>` (`:41`): `print:h-auto print:overflow-visible print:p-0` — garante o reset mesmo se `lg:` casar na largura do papel.

### 22.3 `src/routes/producao.tsx` — página print-friendly

- [ ] `print:hidden` na toolbar (`:125`), no subtítulo do período (`:159`), no bloco de KPIs (`:164`) e no h3/sub da seção da tabela (`:208,:212`).
- [ ] Anular altura/scroll do card da tabela (`:207` → `print:h-auto print:flex-none print:overflow-visible print:border-0 print:shadow-none print:p-0`) e do wrapper interno (`:222` → `print:h-auto print:flex-none print:overflow-visible`).
- [ ] Bloco de cabeçalho só-impressão: `<div className="mb-4 hidden print:block">` com `Produção — {periodLabel}` + `Vendedor: {scopeName} · {N} peças · {formatBRL(revenue)} vendidos` — reusa `periodLabel`, `scopeName`, `sumPieces(scopedOrders)`, `revenue` e `formatBRL` já disponíveis na página.

### 22.4 `src/components/OrdersTable.tsx` — limpar colunas interativas na impressão

- [ ] `print:hidden` no th/td do checkbox (`:305,:374`), no th/td das ações (`:346,:422`) e nos ícones de imagem da coluna Nome (`:380,:383`).
- [ ] Wrapper `overflow-x-auto` → `print:overflow-x-visible` (`:301`); encurtar os tetos `max-w` de Nome/Vendedor na impressão para caber no A4 retrato.
- [ ] Contingência (só se estourar a largura no teste real): variante compacta da tabela dedicada à impressão.

### 22.5 Verificação

- [ ] `npx tsc --noEmit` · `pnpm lint` · `pnpm test` · `pnpm check`.
- [ ] Manual: preview de impressão em `/producao` — dia com poucos pedidos → 1 folha; mês cheio → 2+ folhas com cabeçalho da tabela repetido; tabela sempre na largura total.

**Commits sugeridos (provisórios — a confirmar na execução):**

| #   | Mensagem                                                    | Escopo                                                        |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | `feat(producao): view de impressão — tabela completa em A4` | `styles.css`, `__root.tsx`, `producao.tsx`, `OrdersTable.tsx` |
| 2   | `docs(agenda): fechar Slice 22`                             | `.agent/*`                                                    |
