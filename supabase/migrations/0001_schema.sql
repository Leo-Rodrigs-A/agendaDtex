-- Fase 1: Schema base (ver .agent/migracao-supabase.md)
-- Tabelas espelham as planilhas atuais (users/orders/holidays).

-- profiles: 1:1 com auth.users. profiles.role é a ÚNICA fonte de autorização.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_id text unique, -- id antigo da planilha (rastreio da migração)
  name text not null,
  role text not null default 'vendedor' check (role in ('admin', 'vendedor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_name text not null,
  shirt_count int not null check (shirt_count >= 0),
  others_items_count int not null default 0 check (others_items_count >= 0),
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  delivery_date date not null,
  is_done boolean not null default false,
  imgurl text,
  check (shirt_count + others_items_count > 0)
);

-- Só vale para NOVOS registros: o histórico migrado pode ter entrega no passado.
alter table public.orders
  add constraint orders_delivery_not_past
  check (delivery_date >= created_at::date) not valid;

create index orders_delivery_date_idx on public.orders (delivery_date);
create index orders_user_id_idx on public.orders (user_id);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  holiday_description text not null
);

-- Trigger: auth.users -> profiles. Aceita APENAS `name` do metadata;
-- role inicial é sempre 'vendedor' (promoção a admin é manual, via SQL/dashboard).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
