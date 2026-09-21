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

## Slice 6: Feriados e Usuários

- [ ] Reescrever `/feriados` (hoje é placeholder): lista + form título/data → `POST /feriados`
- [ ] Dropdown de usuário ativo no footer da sidebar (lista de `Users`, sem auth)
- [ ] Reposicionar o toggle da sidebar para ficar dentro do header da sidebar, no modo retraido o icone do logo de torna o icone do toggle quando em hover para indicar que um clique ali restaura a sidebar.
- [ ] exibir o cargo do usuário ao invés do email em todos oss locais onde atualmente são exibidos nome e email.
- [ ] atualmente ao clicar em ordenar pedidos temos um erro de basi ui "Base UI: MenuGroupContext is missing. Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>."
- [ ] adicionar um botão somente icone ao lado dos toggles de tema e cor primária para rápida criação de pedido em qualquer tela, o modal que abre deve ser exatamente o mesmo do botão novo pedido.

## Manutenção (quando sobrar tempo)

- [ ] Rodar `pnpm format` para corrigir estilo de import nos arquivos de registry (`button`, `sidebar`, `calendar` — lint `import/consistent-type-specifier-style`)
