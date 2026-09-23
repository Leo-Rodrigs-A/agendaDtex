-- Fase 3 (complemento): flag de onboarding concluído.
-- A rota /onboarding é alcançável apenas enquanto onboarding_completed = false;
-- após o primeiro acesso, os guards redirecionam para '/'.

alter table public.profiles
  add column onboarding_completed boolean not null default false;

-- RPC: concluir onboarding de forma atômica (nome + flag numa transação só).
-- Role/is_active nunca são tocados aqui — só nome e a flag.
create or replace function public.complete_onboarding(new_name text)
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
  set name = trim(new_name),
      onboarding_completed = true
  where id = auth.uid();
end;
$$;
