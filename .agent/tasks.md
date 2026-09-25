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
- [x] RPC `create_order` com validação de prazo no banco
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
- [x] Paleta de comandos: checkbox is_done (toggle otimista, readOnly p/ designer), vendedor antes do valor, botão follow (`ArrowUpRight`) → `/pedidos?focus=<id>` com scroll ao topo da linha + highlight 2s (`highlightId` no OrdersTable; limpa busca se o pedido estiver fora do filtro)
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
