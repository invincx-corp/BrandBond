begin;

create extension if not exists pgcrypto;

create table if not exists public.local_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_type text not null default 'general',
  location text not null,
  start_time timestamptz not null,
  end_time timestamptz null,
  max_attendees integer null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_local_events_location_start
  on public.local_events (location, start_time asc);

alter table public.local_events enable row level security;

-- Public-readable by any authenticated user
drop policy if exists "local_events_select_all" on public.local_events;
create policy "local_events_select_all"
  on public.local_events
  for select
  using (true);

-- Only creator can insert/update/delete their events (optional; keeps it safe)
drop policy if exists "local_events_insert_creator" on public.local_events;
create policy "local_events_insert_creator"
  on public.local_events
  for insert
  with check (created_by = public.current_user_id());

drop policy if exists "local_events_update_creator" on public.local_events;
create policy "local_events_update_creator"
  on public.local_events
  for update
  using (created_by = public.current_user_id())
  with check (created_by = public.current_user_id());

drop policy if exists "local_events_delete_creator" on public.local_events;
create policy "local_events_delete_creator"
  on public.local_events
  for delete
  using (created_by = public.current_user_id());

create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.local_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ux_event_attendee unique (event_id, user_id),
  constraint chk_event_attendee_status check (status in ('interested','going','not_going'))
);

create index if not exists idx_event_attendees_event_status
  on public.event_attendees (event_id, status);

create index if not exists idx_event_attendees_user
  on public.event_attendees (user_id, updated_at desc);

alter table public.event_attendees enable row level security;

-- Attendees can read their own attendance rows
drop policy if exists "event_attendees_select_own" on public.event_attendees;
create policy "event_attendees_select_own"
  on public.event_attendees
  for select
  using (user_id = public.current_user_id());

-- Users can upsert their own attendance
drop policy if exists "event_attendees_insert_self" on public.event_attendees;
create policy "event_attendees_insert_self"
  on public.event_attendees
  for insert
  with check (user_id = public.current_user_id());

drop policy if exists "event_attendees_update_self" on public.event_attendees;
create policy "event_attendees_update_self"
  on public.event_attendees
  for update
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

drop policy if exists "event_attendees_delete_self" on public.event_attendees;
create policy "event_attendees_delete_self"
  on public.event_attendees
  for delete
  using (user_id = public.current_user_id());

-- Keep updated_at fresh
create or replace function public.touch_event_attendees_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_event_attendees_updated_at on public.event_attendees;
create trigger trg_touch_event_attendees_updated_at
before update on public.event_attendees
for each row execute function public.touch_event_attendees_updated_at();

commit;
