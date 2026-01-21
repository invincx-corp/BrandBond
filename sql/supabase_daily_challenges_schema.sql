begin;

-- =========================================================
-- BrandBond: Daily challenges (persisted)
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  title text not null,
  description text not null,
  reward_points integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.daily_challenges enable row level security;

-- Everyone can read challenges
 drop policy if exists "daily_challenges_select_all" on public.daily_challenges;
 create policy "daily_challenges_select_all"
 on public.daily_challenges
 for select
 using (true);

-- Only allow inserts/updates via service role (no public policy).

create table if not exists public.user_daily_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  is_completed boolean not null default false,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ux_user_daily_challenge unique (user_id, challenge_id)
);

create index if not exists idx_user_daily_challenge_user
  on public.user_daily_challenge_progress (user_id, created_at desc);

alter table public.user_daily_challenge_progress enable row level security;

drop policy if exists "user_daily_challenge_select_own" on public.user_daily_challenge_progress;
create policy "user_daily_challenge_select_own"
  on public.user_daily_challenge_progress
  for select
  using (user_id = public.current_user_id());

drop policy if exists "user_daily_challenge_insert_own" on public.user_daily_challenge_progress;
create policy "user_daily_challenge_insert_own"
  on public.user_daily_challenge_progress
  for insert
  with check (user_id = public.current_user_id());

drop policy if exists "user_daily_challenge_update_own" on public.user_daily_challenge_progress;
create policy "user_daily_challenge_update_own"
  on public.user_daily_challenge_progress
  for update
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create or replace function public.touch_user_daily_challenge_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.is_completed = true and (old.is_completed is distinct from true) then
    new.completed_at := now();
  end if;
  if new.is_completed = false then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_touch_user_daily_challenge_updated_at on public.user_daily_challenge_progress;
create trigger trg_touch_user_daily_challenge_updated_at
before update of is_completed, progress on public.user_daily_challenge_progress
for each row
execute function public.touch_user_daily_challenge_updated_at();

commit;
