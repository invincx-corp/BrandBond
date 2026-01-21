begin;

-- =========================================================
-- BrandBond: Compatibility scoring
-- Stores per-pair compatibility and exposes a simple scoring function.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.user_compatibility (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint chk_compat_user_order check (user_low < user_high),
  constraint chk_compat_users_distinct check (user_low <> user_high),
  constraint ux_compat_pair unique (user_low, user_high),
  constraint chk_score_range check (score >= 0 and score <= 100)
);

create index if not exists idx_user_compat_updated
  on public.user_compatibility (updated_at desc);

alter table public.user_compatibility enable row level security;

drop policy if exists "user_compatibility_select_participants" on public.user_compatibility;
create policy "user_compatibility_select_participants"
  on public.user_compatibility
  for select
  using (
    user_low = public.current_user_id()
    or user_high = public.current_user_id()
  );

-- Inserts/updates should be done by trusted jobs/service role; no public insert/update policies.

create or replace function public.get_compatibility_score(p_other_user uuid)
returns integer
language plpgsql
stable
as $$
declare
  v_low uuid;
  v_high uuid;
  v_score integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_other_user is null then
    raise exception 'Other user is required';
  end if;

  if auth.uid() < p_other_user then
    v_low := auth.uid();
    v_high := p_other_user;
  else
    v_low := p_other_user;
    v_high := auth.uid();
  end if;

  select score into v_score
  from public.user_compatibility
  where user_low = v_low and user_high = v_high
  limit 1;

  return coalesce(v_score, 0);
end;
$$;

commit;
