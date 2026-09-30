# Pendências técnicas

Auditoria do repositório feita em **29/09/2026**, logo após fechar a Slice 16 (altura, navegação de período e limpeza do calendário).

**Estado no momento da auditoria:** `tsc --noEmit` com 0 erros, `pnpm lint` com 0 erros (7 warnings `no-shadow` do registry em `ui/calendar.tsx`/`ui/chart.tsx`), `prettier --check src .agent` limpo, 34 testes passando e build ok. Estas pendências **não bloqueiam** o app — nenhuma delas quebra a aplicação no uso atual em pt-BR/Brasil. A única com risco real de comportamento está no item 1.

Prioridade sugerida: **1 → 3 → 2 → 4 → 5**. Cada item traz a mensagem de commit proposta.

---

## 1. ✅ Resolvido — bug latente de fuso horário nas chaves de dia do calendário

> **Fechado em 29/09/2026**, junto com a Slice 17. As três ocorrências foram
> trocadas por `toDateKey(day)` e por `getOrdersForDay(grouped, day)`, que já
> encapsulam a montagem da chave, e a chave React da coluna virou
> `toDateKey(day)`. O item 2 da lista original (teste com `TZ` não-UTC) foi
> coberto junto: `src/lib/production-calendar.test.ts` passou a ter casos para
> `Asia/Tokyo` e `America/Sao_Paulo`.

**Arquivos:** `src/components/production-calendar/ProductionCalendarMonth.tsx:58`, `src/components/production-calendar/ProductionCalendarDays.tsx:28` e `:34`

A chave de busca no mapa `grouped` é montada com `day.toISOString().split('T')[0]`, mas o mapa é preenchido com `toDateKey()` — que existe exatamente para evitar isso (`src/lib/dates.ts:4`, documentado como "sem timezone").

```ts
// ProductionCalendarMonth.tsx:58 (idem ProductionCalendarDays.tsx:28)
const dayOrders = grouped.get(day.toISOString().split('T')[0]) ?? []
```

`toISOString()` converte para **UTC**: em fusos UTC+ a meia-noite local vira o dia **anterior**, então toda busca erra um dia — os pedidos aparecem no dia errado e a primeira célula do grid fica vazia. No Brasil (UTC-3) funciona, por isso passou despercebido.

O resto do projeto já usa o helper certo (`lib/orders.ts` inteiro, `lib/dates.ts`).

- [x] Trocar as três ocorrências por `toDateKey(day)` (importar de `@/lib/dates`), inclusive a `key={day.toISOString()}` de `ProductionCalendarDays.tsx:34`
- [x] Considerar um teste com `TZ` não-UTC para travar o comportamento (vitest aceita `process.env.TZ` no setup)

```text
fix(calendario): usar toDateKey em vez de toISOString nas chaves de dia
```

---

## 2. ✅ Resolvido — duas fontes de verdade para o usuário (`UserProvider` e shim deprecated removidos)

> **Fechado em 29/09/2026.** `useActiveUser()` virou `useAuth().profile` em
> `routes/index.tsx` e `NewOrderDialog.tsx` (que já lia o mesmo dado pelos
> dois hooks em linhas vizinhas), o `UserProvider` e o wrapper em
> `contexts/index.tsx:9,35,40` foram removidos e o arquivo apagado. O bullet
> de `UserProvider` em `.agent/architecture.md` foi atualizado.

**Arquivos:** `src/components/UserProvider.tsx`, `src/contexts/index.tsx:9,35,40`, `src/routes/index.tsx:38`, `src/components/NewOrderDialog.tsx:21,62`

`UserProvider` é um shim de compatibilidade da era "usuário ativo em localStorage": `activeUser` é só o `profile` da sessão, e `setActiveUser` é um **no-op que só faz `console.warn`** (`UserProvider.tsx:31`). Ele ainda está montado em `AppProviders` e consumido pela home e pelo `NewOrderDialog`, enquanto o resto do app lê o mesmo dado de `useAuth` direto. Ou seja, o mesmo dado é lido de duas formas — e o próprio TODO do arquivo (`UserProvider.tsx:21`) já pede a migração.

- [x] Trocar `useActiveUser()` por `useAuth().profile` em `routes/index.tsx` e `NewOrderDialog.tsx`
- [x] Remover `UserProvider.tsx` e o wrapper em `contexts/index.tsx` (e a linha correspondente do comentário de ordem de providers)
- [x] Atualizar o bullet de `UserProvider` em `.agent/architecture.md`, se houver

```text
refactor(auth): migrar useActiveUser para useAuth e remover o UserProvider
```

---

## 3. ✅ Resolvido — código morto (exports sem uso)

> **Fechado em 29/09/2026.** Os cinco foram removidos, e a auditoria original
> perdeu um sexto: o `export` de `ordersForDay` também era morto (só o
> `businessDaysBreakdown` o consome). Em vez de renomeá-lo, tirei o `export`,
> deixei como função module-private e documentei a convenção de nomes das
> "views por data" num comentário — `ordersForProductionDay` = produção,
> `ordersCreatedOnDay` = `created_at`. A RPC `update_own_name` continua no
> banco, intocada (sem tela de editar nome hoje).

O `tsc` não pega export não importado, então isso passa silencioso.

| Símbolo                             | Arquivo                                    | Observação                                                                                                |
| ----------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `CalendarOrder`                     | `src/lib/production-calendar.ts:9`         | tipo não usado em lugar nenhum                                                                            |
| `ordersForMonth`                    | `src/lib/orders.ts:62`                     | superado por `ordersCreatedInMonth` (usado na home e em `/producao`)                                      |
| `weekStatus` + `WeekDayStatus`      | `src/lib/orders.ts:101,111`                | par inteiro sem uso                                                                                       |
| `updateOwnName`                     | `src/services/profiles.ts`                 | serviço sem uso                                                                                           |
| `isCalendarRoute` (retorno do hook) | `src/hooks/use-production-calendar.ts:171` | exportado pela API do hook, mas ninguém consome (a checagem de rota do hotkey é feita no `GlobalHotkeys`) |
| `ordersForDay` (export)             | `src/lib/orders.ts:26`                     | só usado internamente pelo `businessDaysBreakdown` → virou module-private                                 |

- [x] Remover os cinco, ou documentar no arquivo por que permanecem
- [x] Revisar a dualidade de nomes em `lib/orders.ts` (`ordersForDay`/`ordersForProductionDay`/`ordersCreatedOnDay` e o par `ordersForMonth`/`ordersCreatedInMonth`) para deixar a convenção óbvia

```text
chore: remover código morto e dependências não utilizadas
```

---

## 4. ✅ Resolvido — dependências e configuração não utilizadas

> **Fechado em 29/09/2026.** Removidos `date-fns` (continua resolvida como
> dependência transitiva de `react-day-picker@10` — `pnpm why` confirma),
> `@tanstack/react-devtools` e `@tanstack/react-router-devtools` (o painel vem
> do `@tanstack/devtools-vite`, que ficou), `@vitest/ui` e o alias `#/*`.
> As 4 versões TanStack restantes foram pinadas com `^` no instalado
> (`react-router ^1.170.40`, `router-plugin ^1.168.41`, `devtools-vite ^0.8.5`,
> `eslint-config ^0.4.0`). `tsr generate`, `tsc`, lint, vitest e build ok.

**Arquivos:** `package.json`, `tsconfig.json:16`

- [x] `date-fns` (`package.json:27`) — **zero imports** em `src/`
- [x] `@tanstack/react-devtools` (`:22`) e `@tanstack/react-router-devtools` (`:24`) — zero imports; o painel vem do plugin `@tanstack/devtools-vite` em `vite.config.ts`
- [x] `@vitest/ui` (`:48`) — nenhum script usa (`package.json` não tem script `test`, os testes rodam por `pnpm vitest run`)
- [x] Alias `#/*`: declarado em `package.json` (`imports`) e em `tsconfig.json:16`, com **zero usos** — todo import usa `@/`
- [x] Decidir entre remover o alias ou passar a usá-lo (hoje é configuração morta)
- [x] Pinar as 6 versões em `"latest"` (`:22,23,24,40,41,43`), incluindo `@tanstack/react-router` e `@tanstack/eslint-config` — o lockfile segura o build de hoje, mas qualquer `pnpm update` pode trazer breaking sem aviso

```text
chore: remover dependências e alias não utilizados, pinar versões do TanStack
```

---

## 5. 🟡 Cobertura de teste muito desigual

**Estado:** `src/lib/dates.test.ts` cobre predicados, chaves de dia (inclusive
o fuso do item 1), pulo de feriados/fds e todos os formatadores pt-BR — 28
casos. `src/lib/orders.test.ts` ainda não existe.

Sem nenhum teste:

- [ ] `src/lib/orders.ts` — `sortOrders`, `businessDaysBreakdown`, `sumPieces`/`sumRevenue`/`averageTicket`, `countPieces` (com as quotas `DAILY_PIECE_QUOTA`/`DAILY_ORDER_QUOTA`)
- [x] `src/lib/dates.ts` — `shiftSelectableDay`, `shiftBusinessDay`, `businessDaysBack/Forward`, `nextBusinessDays`, `toDateKey`/`parseDateKey`/`dateKeyOf` (ótimo lugar para travar o item 1)
- [ ] `src/hooks/use-production-calendar.ts` — regras do 16.5 (`setView` normalizando âncora, reset ao entrar na rota)

Começo sugerido: `sortOrders` (lógica pura, muitos casos de borda) e `lib/dates.ts` (protegem o bug de fuso).

```text
test: cobrir lib/orders e lib/dates
```

---

## 6. ✅ Resolvido — formatação de data espalhada e dois jeitos de testar "é hoje"

> **Fechado em 29/09/2026.** `lib/dates.ts` ganhou `capitalize` + 7 formatadores
> (`formatMonthShort`, `formatMonthShortTitle`, `formatMonthLong`,
> `formatMonthLongYear`, `formatDayMonth`, `formatNumericDayMonth`,
> `formatFullDate`) e os 13 `Intl.DateTimeFormat` criados por render dos 8
> arquivos foram trocados por eles. Os predicados `isToday`/`isSameMonth`/
> `isWeekend` migraram de `lib/production-calendar.ts` para `lib/dates.ts`
> (matando o `isWeekend` duplicado) e o `DaySelector` agora usa `isToday(day)`
> no lugar do IIFE com `toDateKey(...) === toDateKey(...)`.

**19 `new Intl.DateTimeFormat(...)` em 12 arquivos**, vários criados a cada render dentro do corpo do componente (`MonthSelector.tsx`, `routes/index.tsx` ×3, `routes/feriados.tsx` ×2, `routes/producao.tsx` ×2). Já existe precedente de helper central no projeto: `formatBRL` em `lib/orders.ts:224`.

- [x] Extrair os formatadores repetidos para um módulo único (mesmo padrão de `formatBRL`), reaproveitando os que já são constantes de módulo (`ProductionCalendarDays.tsx:6` faz isso certo com `DAY_FORMATTER`)
- [x] Unificar o "é hoje": hoje existem `isToday()` (`lib/production-calendar.ts:136`) **e** `toDateKey(day) === toDateKey(new Date())` (`DaySelector.tsx:80`) — deixar um único caminho
- [x] `MonthSelector.tsx` recria o `Intl.DateTimeFormat` a cada render (e `use-production-calendar.ts` cria 3 dentro de `useMemo`)

```text
refactor: centralizar formatadores de data e unificar a checagem de "hoje"
```

---

## 7. 🟡 Acessibilidade inconsistente em botões só-ícone

Os botões só-ícone da toolbar do calendário (`ProductionCalendarToolbar.tsx`, criados na Slice 16.7) têm `aria-label`/`title`, mas dois botões antigos têm nome acessível **apenas via Tooltip** — o conteúdo do tooltip não é fonte de nome acessível, então leitor de tela anuncia só "button":

- [ ] `src/components/Header.tsx:84-92` — "Novo pedido (N)" (`<Plus/>`)
- [ ] `src/components/DaySelector.tsx:82-97` — "Voltar para hoje" (`<CalendarArrowDown/>`)

Referência do que já está certo: `ProductionCalendarMonth.tsx:110` (`aria-label={...}` no botão "expandir") e o bloco de botões da toolbar.

```text
fix(a11y): nome acessível nos botões só-ícone do Header e do DaySelector
```

---

## Resumo

| #   | Pendência                                      | Gravidade | Risco real hoje                  |
| --- | ---------------------------------------------- | --------- | -------------------------------- |
| 1   | Chaves de dia via `toISOString` (fuso)         | 🔴        | só em fusos UTC+                 |
| 2   | `UserProvider` shim com duas fontes de usuário | ✅        | nenhum (equivalentes)            |
| 3   | Exports mortos                                 | ✅        | nenhum                           |
| 4   | Deps/config não usadas + versões `latest`      | ✅        | deriva de dependência            |
| 5   | Cobertura de teste quase inexistente           | 🟡        | regressões passam batidas        |
| 6   | Formatadores de data espalhados                | ✅        | nenhum (re-render desnecessário) |
| 7   | Botões só-ícone sem nome acessível             | 🟡        | leitor de tela                   |

Nada aqui é urgente. O item 1 é o único que eu trataria mesmo sem demanda — são três linhas e elimina uma classe inteira de bug.
