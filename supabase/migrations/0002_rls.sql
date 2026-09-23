-- Fase 2: RLS + RPC de conclusão de pedido (ver .agent/migracao-supabase.md)
-- Modelo: todos leem tudo; escrita restrita por role/ownership.
-- RLS controla LINHAS, não colunas — por isso não existe UPDATE genérico em orders.

-- ---------------------------------------------------------------------------
-- Funções auxiliares (consultam profiles — única fonte de autorização)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.holidays enable row level security;

-- profiles: leitura para usuários ativos (a home lista vendedores)
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.is_active_user());

-- Sem UPDATE direto em profiles: edição do próprio nome via RPC update_own_name.
-- (evita que o usuário altere o próprio role/is_active — RLS não limita colunas)

-- orders: leitura global para usuários ativos (KPIs agregados da home)
create policy orders_select on public.orders
  for select to authenticated
  using (public.is_active_user());

-- orders: insert apenas para si mesmo
create policy orders_insert on public.orders
  for insert to authenticated
  with check (public.is_active_user() and user_id = auth.uid());

-- orders: delete só admin
create policy orders_delete on public.orders
  for delete to authenticated
  using (public.is_admin());

-- SEM policy de UPDATE em orders: toggle de conclusão via RPC complete_order.

-- holidays: leitura para usuários ativos; escrita só admin
create policy holidays_select on public.holidays
  for select to authenticated
  using (public.is_active_user());

create policy holidays_insert on public.holidays
  for insert to authenticated
  with check (public.is_admin());

create policy holidays_delete on public.holidays
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPC: concluir/reabrir pedido (única forma de UPDATE em orders pelo app)
-- ---------------------------------------------------------------------------

create or replace function public.complete_order(order_id uuid, done boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'not authorized';
  end if;

  update public.orders
  set is_done = done
  where id = order_id;

  if not found then
    raise exception 'order % not found', order_id;
  end if;
end;
$$;

-- RPC: o próprio usuário edita apenas o próprio nome
create or replace function public.update_own_name(new_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if new_name is null or length(trim(new_name)) = 0 then
    raise exception 'name is required';
  end if;

  update public.profiles
  set name = trim(new_name)
  where id = auth.uid();
end;
$$;
