-- Slice 10: RBAC com designer + gestão admin + edição/exclusão de pedidos.
-- Ver .agent/migracao-supabase.md (Slice 10).

-- 1) Migração de dados passa a ser manual: legacy_id não é mais necessário.
alter table public.profiles drop column if exists legacy_id;

-- 2) Nova role 'designer' (somente leitura)
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'vendedor', 'designer'));

-- 3) Helper: staff = admin ou vendedor ativo (pode escrever; designer não pode)
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role in ('admin', 'vendedor')
  );
$$;

-- 4) Insert de pedido exige staff (designer não cria pedido)
drop policy orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert to authenticated
  with check (public.is_staff() and user_id = auth.uid());

-- 5) complete_order exige staff (designer não conclui pedido)
create or replace function public.complete_order(order_id uuid, done boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
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

-- 6) Gestão de usuários: admin altera role e is_active de qualquer usuário.
--    (admin não pode desativar nem rebaixar a si mesmo)
create or replace function public.admin_update_user(
  target_user uuid,
  new_role text default null,
  new_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if target_user = auth.uid() then
    raise exception 'cannot change your own role/status';
  end if;
  if new_role is not null and new_role not in ('admin', 'vendedor', 'designer') then
    raise exception 'invalid role: %', new_role;
  end if;

  update public.profiles
  set role = coalesce(new_role, role),
      is_active = coalesce(new_is_active, is_active)
  where id = target_user;

  if not found then
    raise exception 'user % not found', target_user;
  end if;
end;
$$;

-- 7) Editar pedido (campos do formulário). Dono do pedido ou admin.
create or replace function public.update_order(
  order_id uuid,
  new_order_name text,
  new_shirt_count int,
  new_others_items_count int,
  new_total_amount numeric,
  new_delivery_date date,
  new_imgurl text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select user_id into owner from public.orders where id = order_id;
  if not found then
    raise exception 'order % not found', order_id;
  end if;
  if not (public.is_admin() or (public.is_staff() and owner = auth.uid())) then
    raise exception 'not authorized';
  end if;

  update public.orders
  set order_name = new_order_name,
      shirt_count = new_shirt_count,
      others_items_count = new_others_items_count,
      total_amount = new_total_amount,
      delivery_date = new_delivery_date,
      imgurl = new_imgurl
  where id = order_id;
end;
$$;

-- 8) Excluir pedido. Dono ou admin.
create or replace function public.delete_order(order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select user_id into owner from public.orders where id = order_id;
  if not found then
    raise exception 'order % not found', order_id;
  end if;
  if not (public.is_admin() or (public.is_staff() and owner = auth.uid())) then
    raise exception 'not authorized';
  end if;

  delete from public.orders where id = order_id;

end;
$$;

alter table public.orders drop constraint if exists orders_delivery_not_past;