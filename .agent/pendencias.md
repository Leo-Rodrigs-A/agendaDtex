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

## 2. 🟡 Duas fontes de verdade para o usuário (`UserProvider` é shim deprecated)

**Arquivos:** `src/components/UserProvider.tsx`, `src/contexts/index.tsx:9,35,40`, `src/routes/index.tsx:38`, `src/components/NewOrderDialog.tsx:21,62`

`UserProvider` é um shim de compatibilidade da era "usuário ativo em localStorage": `activeUser` é só o `profile` da sessão, e `setActiveUser` é um **no-op que só faz `console.warn`** (`UserProvider.tsx:31`). Ele ainda está montado em `AppProviders` e consumido pela home e pelo `NewOrderDialog`, enquanto o resto do app lê o mesmo dado de `useAuth` direto. Ou seja, o mesmo dado é lido de duas formas — e o próprio TODO do arquivo (`UserProvider.tsx:21`) já pede a migração.

- [ ] Trocar `useActiveUser()` por `useAuth().profile` em `routes/index.tsx` e `NewOrderDialog.tsx`
- [ ] Remover `UserProvider.tsx` e o wrapper em `contexts/index.tsx` (e a linha correspondente do comentário de ordem de providers)
- [ ] Atualizar o bullet de `UserProvider` em `.agent/architecture.md`, se houver

```text
refactor(auth): migrar useActiveUser para useAuth e remover o UserProvider
```

---

## 3. 🟡 Código morto (exports sem uso)

O `tsc` não pega export não importado, então isso passa silencioso.

| Símbolo                             | Arquivo                                    | Observação                                                                                                |
| ----------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `CalendarOrder`                     | `src/lib/production-calendar.ts:9`         | tipo não usado em lugar nenhum                                                                            |
| `ordersForMonth`                    | `src/lib/orders.ts:62`                     | superado por `ordersCreatedInMonth` (usado na home e em `/producao`)                                      |
| `weekStatus` + `WeekDayStatus`      | `src/lib/orders.ts:101,111`                | par inteiro sem uso                                                                                       |
| `updateOwnName`                     | `src/services/profiles.ts`                 | serviço sem uso                                                                                           |
| `isCalendarRoute` (retorno do hook) | `src/hooks/use-production-calendar.ts:171` | exportado pela API do hook, mas ninguém consome (a checagem de rota do hotkey é feita no `GlobalHotkeys`) |

- [ ] Remover os cinco, ou documentar no arquivo por que permanecem
- [ ] Revisar a dualidade de nomes em `lib/orders.ts` (`ordersForDay`/`ordersForProductionDay`/`ordersCreatedOnDay` e o par `ordersForMonth`/`ordersCreatedInMonth`) para deixar a convenção óbvia

```text
chore: remover código morto e dependências não utilizadas
```

---

## 4. 🟡 Dependências e configuração não utilizadas

**Arquivos:** `package.json`, `tsconfig.json:16`

- [ ] `date-fns` (`package.json:27`) — **zero imports** em `src/`
- [ ] `@tanstack/react-devtools` (`:22`) e `@tanstack/react-router-devtools` (`:24`) — zero imports; o painel vem do plugin `@tanstack/devtools-vite` em `vite.config.ts`
- [ ] `@vitest/ui` (`:48`) — nenhum script usa (`package.json` não tem script `test`, os testes rodam por `pnpm vitest run`)
- [ ] Alias `#/*`: declarado em `package.json` (`imports`) e em `tsconfig.json:16`, com **zero usos** — todo import usa `@/`
- [ ] Decidir entre remover o alias ou passar a usá-lo (hoje é configuração morta)
- [ ] Pinar as 6 versões em `"latest"` (`:22,23,24,40,41,43`), incluindo `@tanstack/react-router` e `@tanstack/eslint-config` — o lockfile segura o build de hoje, mas qualquer `pnpm update` pode trazer breaking sem aviso

```text
chore: remover dependências e alias não utilizados, pinar versões do TanStack
```

---

## 5. 🟡 Cobertura de teste muito desigual

**Estado:** ~9.300 linhas em `src/` e **um** único arquivo de teste — `src/lib/production-calendar.test.ts` (34 casos, todos do Slice 15/16).

Sem nenhum teste:

- [ ] `src/lib/orders.ts` — `sortOrders`, `businessDaysBreakdown`, `sumPieces`/`sumRevenue`/`averageTicket`, `countPieces` (com as quotas `DAILY_PIECE_QUOTA`/`DAILY_ORDER_QUOTA`)
- [ ] `src/lib/dates.ts` — `shiftSelectableDay`, `shiftBusinessDay`, `businessDaysBack/Forward`, `nextBusinessDays`, `toDateKey`/`parseDateKey`/`dateKeyOf` (ótimo lugar para travar o item 1)
- [ ] `src/hooks/use-production-calendar.ts` — regras do 16.5 (`setView` normalizando âncora, reset ao entrar na rota)

Começo sugerido: `sortOrders` (lógica pura, muitos casos de borda) e `lib/dates.ts` (protegem o bug de fuso).

```text
test: cobrir lib/orders e lib/dates
```

---

## 6. 🟡 Formatação de data espalhada e dois jeitos de testar "é hoje"

**19 `new Intl.DateTimeFormat(...)` em 12 arquivos**, vários criados a cada render dentro do corpo do componente (`MonthSelector.tsx`, `routes/index.tsx` ×3, `routes/feriados.tsx` ×2, `routes/producao.tsx` ×2). Já existe precedente de helper central no projeto: `formatBRL` em `lib/orders.ts:224`.

- [ ] Extrair os formatadores repetidos para um módulo único (mesmo padrão de `formatBRL`), reaproveitando os que já são constantes de módulo (`ProductionCalendarDays.tsx:6` faz isso certo com `DAY_FORMATTER`)
- [ ] Unificar o "é hoje": hoje existem `isToday()` (`lib/production-calendar.ts:136`) **e** `toDateKey(day) === toDateKey(new Date())` (`DaySelector.tsx:80`) — deixar um único caminho
- [ ] `MonthSelector.tsx` recria o `Intl.DateTimeFormat` a cada render (e `use-production-calendar.ts` cria 3 dentro de `useMemo`)

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
| 2   | `UserProvider` shim com duas fontes de usuário | 🟡        | nenhum (equivalentes)            |
| 3   | Exports mortos                                 | 🟡        | nenhum                           |
| 4   | Deps/config não usadas + versões `latest`      | 🟡        | deriva de dependência            |
| 5   | Cobertura de teste quase inexistente           | 🟡        | regressões passam batidas        |
| 6   | Formatadores de data espalhados                | 🟡        | nenhum (re-render desnecessário) |
| 7   | Botões só-ícone sem nome acessível             | 🟡        | leitor de tela                   |

Nada aqui é urgente. O item 1 é o único que eu trataria mesmo sem demanda — são três linhas e elimina uma classe inteira de bug.
