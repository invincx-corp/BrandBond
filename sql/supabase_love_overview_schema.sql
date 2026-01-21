-- =========================================================
-- BrandBond: Love Dashboard / Love Overview realtime schema
-- =========================================================

begin;

-- --------------- Extensions ---------------
create extension if not exists pgcrypto;

-- --------------- Enum types ---------------

do $$ begin
  create type public.notification_type as enum (
    'new_match',
    'date_request',
    'message',
    'date_accepted',
    'profile_view',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.date_request_status as enum (
    'pending',
    'accepted',
    'declined',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_type as enum (
    'new_match',
    'date_request_sent',
    'date_request_received',
    'date_request_accepted',
    'date_request_declined',
    'notification_read',
    'notification_deleted',
    'profile_updated'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_status as enum (
    'pending',
    'accepted',
    'rejected',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

-- --------------- Helper function: current user id ---------------
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

-- =========================================================
-- 2) NOTIFICATIONS
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  entity_type text null,  -- e.g. 'match', 'date_request', 'conversation'
  entity_id uuid null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id)
  where is_read = false;

alter table public.notifications enable row level security;

-- RLS: user can only read their notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (user_id = public.current_user_id());

-- RLS: user can insert notifications only for themselves (you may later relax this for server-side jobs)
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
on public.notifications
for insert
with check (user_id = public.current_user_id());

-- RLS: user can update only their notifications (mark read)
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

-- RLS: user can delete only their notifications
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications
for delete
using (user_id = public.current_user_id());

-- Optional: keep read_at in sync
create or replace function public.set_notification_read_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_read = true and (old.is_read is distinct from true) then
    new.read_at := now();
  end if;

  if new.is_read = false then
    new.read_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_notification_read_at on public.notifications;
create trigger trg_set_notification_read_at
before update of is_read on public.notifications
for each row execute function public.set_notification_read_at();

-- =========================================================
-- 3) DATE REQUESTS (invites)
-- =========================================================
create table if not exists public.date_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null, -- "Coffee Date", "Dinner Date", etc.
  message text not null,
  proposed_at timestamptz null,
  proposed_location text null,
  status public.date_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz null,

  -- read flags (separate for sender/receiver)
  is_read_by_sender boolean not null default true,
  is_read_by_receiver boolean not null default false
);

create index if not exists idx_date_requests_to_created
  on public.date_requests (to_user_id, created_at desc);

create index if not exists idx_date_requests_from_created
  on public.date_requests (from_user_id, created_at desc);

create index if not exists idx_date_requests_to_unread
  on public.date_requests (to_user_id)
  where is_read_by_receiver = false;

create index if not exists idx_date_requests_status
  on public.date_requests (status);

alter table public.date_requests enable row level security;

-- RLS: participants can select
drop policy if exists "date_requests_select_participants" on public.date_requests;
create policy "date_requests_select_participants"
on public.date_requests
for select
using (
  from_user_id = public.current_user_id()
  or to_user_id = public.current_user_id()
);

-- RLS: sender can insert where sender = auth.uid()
drop policy if exists "date_requests_insert_sender" on public.date_requests;
create policy "date_requests_insert_sender"
on public.date_requests
for insert
with check (from_user_id = public.current_user_id());

-- RLS: participants can update their shared row (status/read flags)
drop policy if exists "date_requests_update_participants" on public.date_requests;
create policy "date_requests_update_participants"
on public.date_requests
for update
using (
  from_user_id = public.current_user_id()
  or to_user_id = public.current_user_id()
)
with check (
  from_user_id = public.current_user_id()
  or to_user_id = public.current_user_id()
);

-- RLS: sender can delete while pending (optional rule; change if you want)
drop policy if exists "date_requests_delete_sender_pending" on public.date_requests;
create policy "date_requests_delete_sender_pending"
on public.date_requests
for delete
using (
  from_user_id = public.current_user_id()
  and status = 'pending'
);

-- keep responded_at in sync
create or replace function public.set_date_request_responded_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('accepted','declined','cancelled') then
      new.responded_at := now();
    else
      new.responded_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_date_request_responded_at on public.date_requests;
create trigger trg_set_date_request_responded_at
before update of status on public.date_requests
for each row execute function public.set_date_request_responded_at();

-- =========================================================
-- 4) MATCHES (two-way modeling)
-- =========================================================
-- One row per pair, canonical ordering ensures uniqueness
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  status public.match_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  constraint chk_user_order check (user_low < user_high),
  constraint chk_users_distinct check (user_low <> user_high)
);

create unique index if not exists uniq_matches_pair
  on public.matches (user_low, user_high);

create index if not exists idx_matches_user_low_created
  on public.matches (user_low, created_at desc);

create index if not exists idx_matches_user_high_created
  on public.matches (user_high, created_at desc);

alter table public.matches enable row level security;

-- RLS: only participants can see match row
drop policy if exists "matches_select_participants" on public.matches;
create policy "matches_select_participants"
on public.matches
for select
using (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

-- RLS: insert allowed if current user is one of the users (you may later restrict further)
drop policy if exists "matches_insert_participants" on public.matches;
create policy "matches_insert_participants"
on public.matches
for insert
with check (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

-- RLS: update allowed for participants
drop policy if exists "matches_update_participants" on public.matches;
create policy "matches_update_participants"
on public.matches
for update
using (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
)
with check (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

-- Keep accepted_at in sync
create or replace function public.set_match_accepted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    new.accepted_at := now();
  end if;

  if new.status <> 'accepted' then
    new.accepted_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_match_accepted_at on public.matches;
create trigger trg_set_match_accepted_at
before update of status on public.matches
for each row execute function public.set_match_accepted_at();

-- Convenience view: "my matches" returns the other_user_id
create or replace view public.my_matches as
select
  m.id as match_id,
  case
    when m.user_low = public.current_user_id() then m.user_high
    else m.user_low
  end as other_user_id,
  m.status,
  m.created_at,
  m.accepted_at,
  m.metadata
from public.matches m
where m.user_low = public.current_user_id() or m.user_high = public.current_user_id();

-- =========================================================
-- 5) ACTIVITY FEED
-- =========================================================
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type public.activity_type not null,
  title text not null,
  description text not null,
  activity_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activities_user_created
  on public.user_activities (user_id, created_at desc);

alter table public.user_activities enable row level security;

drop policy if exists "user_activities_select_own" on public.user_activities;
create policy "user_activities_select_own"
on public.user_activities
for select
using (user_id = public.current_user_id());

drop policy if exists "user_activities_insert_own" on public.user_activities;
create policy "user_activities_insert_own"
on public.user_activities
for insert
with check (user_id = public.current_user_id());

drop policy if exists "user_activities_delete_own" on public.user_activities;
create policy "user_activities_delete_own"
on public.user_activities
for delete
using (user_id = public.current_user_id());

-- Usually activities are append-only; allow update only if you want edits
drop policy if exists "user_activities_update_own" on public.user_activities;
create policy "user_activities_update_own"
on public.user_activities
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

-- =========================================================
-- 6) OPTIONAL: LOVE OVERVIEW STATS CACHE (fast totals)
-- =========================================================
create table if not exists public.user_love_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_matches integer not null default 0,
  pending_date_requests integer not null default 0,
  unread_notifications integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_love_stats enable row level security;

drop policy if exists "user_love_stats_select_own" on public.user_love_stats;
create policy "user_love_stats_select_own"
on public.user_love_stats
for select
using (user_id = public.current_user_id());

drop policy if exists "user_love_stats_insert_own" on public.user_love_stats;
create policy "user_love_stats_insert_own"
on public.user_love_stats
for insert
with check (user_id = public.current_user_id());

drop policy if exists "user_love_stats_update_own" on public.user_love_stats;
create policy "user_love_stats_update_own"
on public.user_love_stats
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

-- Helper: ensure row exists for current user
create or replace function public.ensure_user_love_stats_row(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.user_love_stats(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

alter function public.ensure_user_love_stats_row(uuid) security definer;

revoke all on function public.ensure_user_love_stats_row(uuid) from public;
grant execute on function public.ensure_user_love_stats_row(uuid) to authenticated;

-- Recompute stats for a user
create or replace function public.recompute_user_love_stats(p_user_id uuid)
returns void
language plpgsql
as $$
declare
  v_total_matches integer;
  v_pending_date_requests integer;
  v_unread_notifications integer;
begin
  perform public.ensure_user_love_stats_row(p_user_id);

  select count(*) into v_total_matches
  from public.matches m
  where (m.user_low = p_user_id or m.user_high = p_user_id)
    and m.status = 'accepted';

  select count(*) into v_pending_date_requests
  from public.date_requests dr
  where dr.to_user_id = p_user_id
    and dr.status = 'pending'
    and dr.is_read_by_receiver = false;

  select count(*) into v_unread_notifications
  from public.notifications n
  where n.user_id = p_user_id
    and n.is_read = false;

  update public.user_love_stats
  set total_matches = v_total_matches,
      pending_date_requests = v_pending_date_requests,
      unread_notifications = v_unread_notifications,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

alter function public.recompute_user_love_stats(uuid) security definer;

revoke all on function public.recompute_user_love_stats(uuid) from public;
grant execute on function public.recompute_user_love_stats(uuid) to authenticated;

-- Triggers to keep stats updated (simple, robust approach)
create or replace function public.touch_love_stats_from_notifications()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_user_love_stats(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_notifications_touch_stats_ins on public.notifications;
create trigger trg_notifications_touch_stats_ins
after insert on public.notifications
for each row execute function public.touch_love_stats_from_notifications();

drop trigger if exists trg_notifications_touch_stats_upd on public.notifications;
create trigger trg_notifications_touch_stats_upd
after update on public.notifications
for each row execute function public.touch_love_stats_from_notifications();

drop trigger if exists trg_notifications_touch_stats_del on public.notifications;
create trigger trg_notifications_touch_stats_del
after delete on public.notifications
for each row execute function public.touch_love_stats_from_notifications();

create or replace function public.touch_love_stats_from_date_requests()
returns trigger
language plpgsql
as $$
begin
  -- affects receiver stats (and optionally sender, but receiver is the unread counter)
  perform public.recompute_user_love_stats(coalesce(new.to_user_id, old.to_user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_date_requests_touch_stats_ins on public.date_requests;
create trigger trg_date_requests_touch_stats_ins
after insert on public.date_requests
for each row execute function public.touch_love_stats_from_date_requests();

drop trigger if exists trg_date_requests_touch_stats_upd on public.date_requests;
create trigger trg_date_requests_touch_stats_upd
after update on public.date_requests
for each row execute function public.touch_love_stats_from_date_requests();

drop trigger if exists trg_date_requests_touch_stats_del on public.date_requests;
create trigger trg_date_requests_touch_stats_del
after delete on public.date_requests
for each row execute function public.touch_love_stats_from_date_requests();

create or replace function public.recompute_user_love_stats_from_match()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_user_love_stats(coalesce(new.user_low, old.user_low));
  perform public.recompute_user_love_stats(coalesce(new.user_high, old.user_high));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_matches_touch_stats_ins on public.matches;
create trigger trg_matches_touch_stats_ins
after insert on public.matches
for each row execute function public.recompute_user_love_stats_from_match();

drop trigger if exists trg_matches_touch_stats_upd on public.matches;
create trigger trg_matches_touch_stats_upd
after update on public.matches
for each row execute function public.recompute_user_love_stats_from_match();

drop trigger if exists trg_matches_touch_stats_del on public.matches;
create trigger trg_matches_touch_stats_del
after delete on public.matches
for each row execute function public.recompute_user_love_stats_from_match();

commit;
