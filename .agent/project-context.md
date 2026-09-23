# Project Context: Mini Sistema de Pedidos e Produção (MVP)

## Visão Geral

Sistema interno para registrar pedidos, atribuir a vendedores autenticados, calcular/organizar prazos de entrega e acompanhar a evolução da produção.

- **Usuários:** 2 a 3 usuários internos, autenticação real via Supabase Auth (convite por e-mail).
- **Roles:** `admin` (gerencia usuários e feriados, KPIs de todos), `vendedor` (cria/edita/conclui pedidos), `designer` (somente leitura).
- **Volume:** 100 a 200 pedidos/mês (~3-7 pedidos/dia).
- **Nota:** o dono do projeto está aprendendo React/TanStack Router — preferir explicações claras e código simples/legível a abstrações sofisticadas.

## Funcionalidades

**Implementadas:**

- **Auth completo:** login, onboarding (primeiro acesso define senha + nome, uma vez via `onboarding_completed`), splash animada com logo DTex (loop 2s, mínimo 2s), logout, guarda de rotas.
- **Shell global:** sidebar (logo DTex, nav, botão "Encontrar" Ctrl+K, menu do usuário com Sair + ações admin) + header com título dinâmico, tema e criação rápida de pedido.
- **Dashboard (`/`):** KPIs por dia (pedidos, capacidade) e por mês (pedidos, valor). Admin tem segmented "Todos / Somente eu" no grupo mensal. Dia: KPIs globais + segmented todos/usuário.
- **Pedidos (`/pedidos`):** busca, sort por colunas, lista/grade, "carregar mais" (50 em 50), checkbox de conclusão otimista (RPC), editar/excluir por linha (dono ou admin), linha clicável abre imagem (Drive).
- **Feriados (`/feriados`):** lista/grade, adicionar só admin.
- **Usuários (admin):** convite por e-mail com escolha de role (vendedor/designer) e gerenciador (trocar role, ativar/desativar).
- **Hotkeys:** Ctrl+K paleta (busca pedidos + ações), N/S/H/P/F.
- **Seletores:** calendário abre no mês da data selecionada, fds/feriados bloqueados; botão "hoje" (CalendarArrowDown) e "dia de agendamento mais distante" (CalendarClock).

**Planejadas/Próximas:**

- Regra de prazo validada no banco (RPC `create_order` — dívida consciente do MVP; hoje é client-side).
- Offline-first real (PWA hoje é só instalável; escritas exigem conexão).

## Stack Tecnológica

- **Frontend:** TanStack Router + Vite + React 19 + Tailwind CSS v4 + shadcn registry `base-vega` (Base UI).
- **Backend/DB:** Supabase (Postgres + Auth + RLS + RPCs + Edge Functions).
- **Hotkeys:** react-hotkeys-hook.
- **Dados:** fetch escalonado (mês atual + futuros → histórico em background); filtros e cálculos client-side.

## Regras de Negócio Core

1. **Prazos:** fins de semana e feriados bloqueados nos seletores de data (home e form de pedido). Validação no banco virá depois (RPC).
2. **Autorização:** RLS + RPCs; `profiles.role` é a fonte da verdade. `is_active = false` bloqueia dados (RLS) e força logout (front).
3. **Vínculo de pedidos:** todo pedido tem `user_id` do criador; edição/exclusão por dono ou admin.
4. **Usuários:** convite admin via Edge Function; promoção a admin é manual (banco) para o primeiro usuário.
