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

## Slice 3: Tipos TypeScript e Cliente HTTP

- [ ] Criar `src/types/index.ts` com interfaces de Pedido, Usuário, Feriado
- [ ] Criar `src/services/api.ts` para chamadas HTTP contra o Apps Script
- [ ] Fetch inicial no root (últimos 500 pedidos + feriados) alimentando providers
- [ ] Definir estratégia pós-POST (re-fetch vs update local do snapshot)

## Slice 4: Dados reais na Home

- [ ] Funções puras de filtro/cálculo em `src/lib/` (recebem `pedidos` + `useFilters()`)
- [ ] Ligar KPIs de dia/mês e lista "pedidos do dia" aos dados reais
- [ ] Bloquear fins de semana e feriados no `DaySelector` (`disabled` do Calendar)
- [ ] Gráfico "Status da Semana" (barras, sempre relativo a hoje, sem interação)

## Slice 5: Módulo de Pedidos

- [ ] Listagem real em `src/routes/pedidos.tsx` (busca e filtro de status client-side)
- [ ] Form/modal "Novo Pedido" com seletor de data bloqueando fds/feriados
- [ ] Integrar criação (`POST /pedidos`) e atualização do snapshot local

## Slice 6: Feriados e Usuários

- [ ] Reescrever `/feriados` (hoje é placeholder): lista + form título/data → `POST /feriados`
- [ ] Dropdown de usuário ativo no footer da sidebar (lista de `Users`, sem auth)

## Manutenção (quando sobrar tempo)

- [ ] Rodar `pnpm format` para corrigir estilo de import nos arquivos de registry (`button`, `sidebar`, `calendar` — lint `import/consistent-type-specifier-style`)
