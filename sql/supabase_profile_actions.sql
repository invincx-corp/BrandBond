-- Profile actions (Love Interests) - like/love/bookmark
-- This matches the existing LoveDashboard UI behavior.

begin;

-- Enum for actions
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_action_type') then
    create type public.profile_action_type as enum ('like', 'love', 'bookmark');
  end if;
end $$;

create table if not exists public.profile_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  action public.profile_action_type not null,
  created_at timestamptz not null default now()
);

-- Ensure toggle semantics: only one row per (user, target, action)
create unique index if not exists ux_profile_actions_user_target_action
  on public.profile_actions (user_id, target_user_id, action);

create index if not exists idx_profile_actions_user_created
  on public.profile_actions (user_id, created_at desc);

create index if not exists idx_profile_actions_target
  on public.profile_actions (target_user_id);

alter table public.profile_actions enable row level security;

-- =========================================================
-- Mutual love -> matches
-- When both users have action='love' on each other, mark pair as an accepted match.
-- When one side removes love, revert to pending.
-- =========================================================

create or replace function public._bb_upsert_match_from_pair(p_user_a uuid, p_user_b uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_low uuid;
  v_high uuid;
begin
  if p_user_a is null or p_user_b is null then
    return;
  end if;
  if p_user_a = p_user_b then
    return;
  end if;

  if p_user_a < p_user_b then
    v_low := p_user_a;
    v_high := p_user_b;
  else
    v_low := p_user_b;
    v_high := p_user_a;
  end if;

  insert into public.matches (user_low, user_high, status)
  values (v_low, v_high, 'accepted')
  on conflict (user_low, user_high)
  do update set status = 'accepted';
end;
$$;

revoke all on function public._bb_upsert_match_from_pair(uuid, uuid) from public;
revoke all on function public._bb_upsert_match_from_pair(uuid, uuid) from anon;
revoke all on function public._bb_upsert_match_from_pair(uuid, uuid) from authenticated;

create or replace function public._bb_set_match_pending_from_pair(p_user_a uuid, p_user_b uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_low uuid;
  v_high uuid;
begin
  if p_user_a is null or p_user_b is null then
    return;
  end if;
  if p_user_a = p_user_b then
    return;
  end if;

  if p_user_a < p_user_b then
    v_low := p_user_a;
    v_high := p_user_b;
  else
    v_low := p_user_b;
    v_high := p_user_a;
  end if;

  update public.matches
  set status = 'pending'
  where user_low = v_low and user_high = v_high;
end;
$$;

revoke all on function public._bb_set_match_pending_from_pair(uuid, uuid) from public;
revoke all on function public._bb_set_match_pending_from_pair(uuid, uuid) from anon;
revoke all on function public._bb_set_match_pending_from_pair(uuid, uuid) from authenticated;

create or replace function public.trg_profile_actions_sync_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_target uuid;
  v_has_reciprocal boolean;
begin
  -- Only apply to 'love' actions.
  if tg_op = 'INSERT' then
    if new.action <> 'love' then
      return new;
    end if;
    v_user := new.user_id;
    v_target := new.target_user_id;
  elsif tg_op = 'DELETE' then
    if old.action <> 'love' then
      return old;
    end if;
    v_user := old.user_id;
    v_target := old.target_user_id;
  else
    return coalesce(new, old);
  end if;

  -- reciprocal love exists?
  select exists(
    select 1
    from public.profile_actions pa
    where pa.user_id = v_target
      and pa.target_user_id = v_user
      and pa.action = 'love'
    limit 1
  ) into v_has_reciprocal;

  if v_has_reciprocal then
    perform public._bb_upsert_match_from_pair(v_user, v_target);
  else
    -- Not mutual anymore; revert to pending.
    perform public._bb_set_match_pending_from_pair(v_user, v_target);
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.trg_profile_actions_sync_matches() from public;
revoke all on function public.trg_profile_actions_sync_matches() from anon;
revoke all on function public.trg_profile_actions_sync_matches() from authenticated;

drop trigger if exists trg_profile_actions_sync_matches_ins on public.profile_actions;
create trigger trg_profile_actions_sync_matches_ins
after insert on public.profile_actions
for each row
execute function public.trg_profile_actions_sync_matches();

drop trigger if exists trg_profile_actions_sync_matches_del on public.profile_actions;
create trigger trg_profile_actions_sync_matches_del
after delete on public.profile_actions
for each row
execute function public.trg_profile_actions_sync_matches();

drop policy if exists "profile_actions_select_own" on public.profile_actions;
create policy "profile_actions_select_own"
on public.profile_actions
for select
using (user_id = public.current_user_id());

drop policy if exists "profile_actions_insert_own" on public.profile_actions;
create policy "profile_actions_insert_own"
on public.profile_actions
for insert
with check (user_id = public.current_user_id());

drop policy if exists "profile_actions_delete_own" on public.profile_actions;
create policy "profile_actions_delete_own"
on public.profile_actions
for delete
using (user_id = public.current_user_id());

commit;
