# Architecture & API Contract

## Fluxo de Comunicação

```text
React Frontend ──(HTTP)──▶ Google Apps Script Web App ──(LockService)──▶ Google Sheets
```

## Arquitetura de Camadas

- **Frontend (React):** UI, estado local/global, formulários, tabelas, dashboard, consumo de API.
- **Backend (Apps Script):** gateway de acesso a planilha, inicialmente sem autenticação, repositório de planilhas, permite gravar/ler o conteúdo da planilha linkada.
- **Persistência (Google Sheets):** Armazenamento em tabela.

## Contrato de Endpoints (Apps Script)

- `GET /pedidos` - Retorna todos os ultimos 500 pedidos. **Ponto único de leitura inicial.**
- `GET /allpedidos` - Retorna todos os pedidos do sistema.
- `GET /feriados` - Retorna a lista completa de feriados cadastrados.
- `GET /users` - Retorna a lista de usuários cadastrados no sistema.
- `POST /pedidos` - Cria novo pedido, com os dados enviados pelo form do frontend.
- `POST /feriados` - Cria novo feriado.
- `POST /users` - adiciona um novo usuário no sistema.

## Decisões de Frontend (estado atual)

- **Stack real:** TanStack **Router** + Vite (SPA pura). Não usamos features do TanStack Start (server functions, SSR) — ignorar essa parte do README padrão do template.
- **Rotas file-based atuais:** `/` (dashboard), `/pedidos`, `/feriados`. A rota `/agenda` foi removida; `/feriados` ainda é placeholder (conteúdo copiado da antiga agenda — pendente de reescrita).
- **Roteamento gerado:** `src/routeTree.gen.ts` é gerado por `pnpm generate-routes` / plugin do Vite — nunca editar manualmente.

### Sistema de UI

- shadcn com registry **`base-vega` (Base UI)** — **não existe Radix no projeto**.
- Convenção crítica: composição via prop **`render`**, não `asChild` (API do Base UI `useRender`). Ex.: `<SidebarMenuButton render={<Link to="/x" />}>texto</SidebarMenuButton>`. Erro comum: misturar `render` com um `<Link>` filho aninhado (gera `<a>` dentro de `<a>`).
- Componentes de overlay disponíveis: `ui/popover.tsx` (Base UI Popover), `ui/sheet.tsx`, `ui/dropdown-menu.tsx`, `ui/tooltip.tsx`.
- `ui/calendar.tsx`: shadcn Calendar sobre **react-day-picker** (locale pt-BR via `react-day-picker/locale` → `ptBR`). Suporta `disabled` (matchers) — ponto de encaixe para bloquear fins de semana e feriados.

### Estratégia de dados e estado

- **Fetch único na inicialização:** `GET /pedidos` (últimos 500). **Todos os filtros, validações e cálculos são client-side** — não há re-fetch por filtro.
- **Filtros globais de período:** `FilterProvider` (React Context) montado em `src/routes/__root.tsx` acima do `<Outlet />`, expondo `{ day, month, year, setDay, setMonthYear }` via hook `useFilters()`. Sobrevive à navegação entre rotas (decisão deliberada — operador alterna telas com frequência). **Não** usamos search params para isso.
- **Componentes consumidores:** `DaySelector` (popover + Calendar) e `MonthSelector` (popover com stepper de ano + grid 3x4 de meses abreviados), usados no header da rota `/`.
- **Datas:** formatação via `Intl.DateTimeFormat('pt-BR', ...)` nativo — sem date-fns no front.
- **Loader do root (planejado):** o fetch inicial dos 500 pedidos ainda não existe no código (hoje tudo é mock); quando o Apps Script estiver no ar, entra como loader/data provider no root.
- **Pós-POST (pendente de definição):** após `POST /pedidos` etc., o front deverá re-buscar o snapshot ou atualizar o estado em memória localmente.
