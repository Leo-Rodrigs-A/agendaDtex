# Project Context: Mini Sistema de Pedidos e Produção (MVP)

## Visão Geral

Sistema interno para registrar pedidos, e atribuir a vendedores conectados, calcular/organizar prazos de entrega e acompanhar a evolução da produção.

- **Usuários:** 2 a 3 usuários internos.
- **Volume:** 100 a 200 pedidos/mês (~3-7 pedidos/dia).
- **Objetivo:** Gerenciamento, Organização, Acompanhamento, aprendizado e praticidade.
- **Nota:** o dono do projeto está aprendendo React/TanStack Router — preferir explicações claras e código simples/legível a abstrações sofisticadas.

## Funcionalidades

**Implementadas (UI com dados mock):**

- **Shell global:** sidebar com navegação (Home, Pedidos, Feriados) + header com título dinâmico por rota.
- **Dashboard (`/`):** cards de KPI por dia (pedidos, capacidade) e por mês (pedidos, valor vendido) + seção de pedidos do dia e status da semana. Filtros de **dia** (calendário em popover) e **mês/ano** (popover com grid de meses) no header, compartilhados globalmente via `FilterProvider`.

**Planejadas:**

- **Cadastrar pedidos:** Atribuição a vendedor, verificar datas disponíveis com base em regras de finais de semana e feriados ("Novo Pedido" em `/pedidos`).
- **Listar Pedidos:** com separação por vendedor, e na home já existe a lista "pedidos do dia selecionado" (placeholder) que seguirá o seletor de dia global.
- **Listar Vendas:** quantidade de peças e valor vendido por vendedor, com visualização por dia/mês/ano e impressão via print do browser.
- **Definir feriados:** rota `/feriados` existe mas é **placeholder** (conteúdo copiado da antiga agenda) — pendente: lista de feriados + form título/data que injeta na planilha.
- **Cadastrar usuários:** form que envia para a planilha `Users`.

## Stack Tecnológica

- **Frontend:** TanStack Router + Vite + React 19 + Tailwind CSS v4 + shadcn registry `base-vega` (**Base UI**, sem Radix).
- **Roteamento:** TanStack Router file-based (`src/routes/`, root em `__root.tsx`).
- **Backend/API:** Google Apps Script (Web App).
- **Persistência:** Google Sheets.
- **Comunicação:** HTTP + JSON. Fetch único inicial (500 pedidos); filtros e validações 100% client-side.

## Regras de Negócio Core

1. **Prazos:** Calculados em um utilitário em lib, o app recebe um json com o conteudo de 500 linhas da planilha de pedidos, e tudo que tiver em (dias úteis, feriados, capacidade diária).
2. **Concorrência:** Uso de `LockService` no Apps Script para evitar conflitos de gravação simultânea.
3. **Finais de semana e Feriados:** são datas que ficam indisponíveis no seletor de data. **Base técnica pronta:** o `Calendar` do shadcn (usado pelo `DaySelector`) aceita `disabled` com matchers — a mesma regra será aplicada no seletor da home e no futuro form de pedido.
4. **Estrutura de Dados:** dentro da planilha que servirá com banco de dados teremos as planilhas: `Pedidos`, `Users` e `Feriados`.
5. **Usuários:** Inicialmente é possivel alterar o usuário ativo simplesmente clicando no dropdown do user e selecionando da lista, sem autenticação, o usuário que estiver selecionado será atribuido a todo novo pedido criado naquele browser, para alterar o usuário que ficou atribuido a um pedido é nescessário manualmente mudar na planilha. **Status:** footer da sidebar ainda exibe usuário estático (mock) — dropdown pendente.
