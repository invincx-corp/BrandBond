begin;

-- =========================================================
-- BrandBond: Profile reveals (unlock blurred profiles)
-- One row per (viewer, target)
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.profile_reveals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chk_profile_reveals_users_distinct check (user_id <> target_user_id)
);

create unique index if not exists ux_profile_reveals_user_target
  on public.profile_reveals (user_id, target_user_id);

create index if not exists idx_profile_reveals_user_created
  on public.profile_reveals (user_id, created_at desc);

alter table public.profile_reveals enable row level security;

drop policy if exists "profile_reveals_select_own" on public.profile_reveals;
create policy "profile_reveals_select_own"
  on public.profile_reveals
  for select
  using (user_id = public.current_user_id());

drop policy if exists "profile_reveals_insert_own" on public.profile_reveals;
create policy "profile_reveals_insert_own"
  on public.profile_reveals
  for insert
  with check (user_id = public.current_user_id());

drop policy if exists "profile_reveals_delete_own" on public.profile_reveals;
create policy "profile_reveals_delete_own"
  on public.profile_reveals
  for delete
  using (user_id = public.current_user_id());

commit;
