begin;

-- =========================================================
-- BrandBond: Date planning persistence
-- Stores a "plan" attached to a date_request (optional) or directly to a match.
-- =========================================================

create extension if not exists pgcrypto;

-- Enum for plan status

do $$ begin
  create type public.date_plan_status as enum ('planned', 'sent', 'accepted', 'declined', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.date_plans (
  id uuid primary key default gen_random_uuid(),

  -- Parties
  creator_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,

  -- Optional linkage
  date_request_id uuid null references public.date_requests(id) on delete set null,
  match_id uuid null,

  -- Plan fields
  type text not null,
  plan_date date not null,
  plan_time text not null,
  location text null,
  activity text null,
  budget text null,
  description text null,
  special_notes text null,

  status public.date_plan_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_date_plans_users_distinct check (creator_id <> partner_id)
);

create index if not exists idx_date_plans_creator_created
  on public.date_plans (creator_id, created_at desc);

create index if not exists idx_date_plans_partner_created
  on public.date_plans (partner_id, created_at desc);

create index if not exists idx_date_plans_status
  on public.date_plans (status);

create index if not exists idx_date_plans_date_request
  on public.date_plans (date_request_id);

alter table public.date_plans enable row level security;

drop policy if exists "date_plans_select_participants" on public.date_plans;
create policy "date_plans_select_participants"
  on public.date_plans
  for select
  using (
    creator_id = public.current_user_id()
    or partner_id = public.current_user_id()
  );

drop policy if exists "date_plans_insert_creator" on public.date_plans;
create policy "date_plans_insert_creator"
  on public.date_plans
  for insert
  with check (creator_id = public.current_user_id());

drop policy if exists "date_plans_update_participants" on public.date_plans;
create policy "date_plans_update_participants"
  on public.date_plans
  for update
  using (
    creator_id = public.current_user_id()
    or partner_id = public.current_user_id()
  )
  with check (
    creator_id = public.current_user_id()
    or partner_id = public.current_user_id()
  );

drop policy if exists "date_plans_delete_creator" on public.date_plans;
create policy "date_plans_delete_creator"
  on public.date_plans
  for delete
  using (creator_id = public.current_user_id());

-- Keep updated_at in sync
create or replace function public.touch_date_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_date_plans_updated_at on public.date_plans;
create trigger trg_touch_date_plans_updated_at
before update on public.date_plans
for each row
execute function public.touch_date_plans_updated_at();

commit;
