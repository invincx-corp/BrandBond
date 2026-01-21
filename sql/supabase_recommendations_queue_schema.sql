begin;

create extension if not exists pgcrypto;

-- =========================================================
-- BrandBond: Recommendation recompute queue (Option A)
-- =========================================================

create table if not exists public.recommendation_recompute_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text null,
  created_at timestamptz not null default now(),
  processed_at timestamptz null,
  attempts integer not null default 0,
  locked_at timestamptz null,
  locked_by text null,
  last_error text null
);

create index if not exists idx_reco_queue_unprocessed
  on public.recommendation_recompute_queue (processed_at, created_at);

create index if not exists idx_reco_queue_user
  on public.recommendation_recompute_queue (user_id, created_at desc);

alter table public.recommendation_recompute_queue enable row level security;

-- No public access; queue is for server-side jobs only.
drop policy if exists "recommendation_recompute_queue_select_none" on public.recommendation_recompute_queue;
create policy "recommendation_recompute_queue_select_none"
  on public.recommendation_recompute_queue
  for select
  using (false);

drop policy if exists "recommendation_recompute_queue_insert_none" on public.recommendation_recompute_queue;
create policy "recommendation_recompute_queue_insert_none"
  on public.recommendation_recompute_queue
  for insert
  with check (false);

drop policy if exists "recommendation_recompute_queue_update_none" on public.recommendation_recompute_queue;
create policy "recommendation_recompute_queue_update_none"
  on public.recommendation_recompute_queue
  for update
  using (false)
  with check (false);

drop policy if exists "recommendation_recompute_queue_delete_none" on public.recommendation_recompute_queue;
create policy "recommendation_recompute_queue_delete_none"
  on public.recommendation_recompute_queue
  for delete
  using (false);

-- =========================================================
-- Enqueue helper + triggers
-- =========================================================

create or replace function public.enqueue_recommendation_recompute(p_user_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  -- Avoid queue spam: if there is already an unprocessed row for this user, do nothing.
  if exists (
    select 1
    from public.recommendation_recompute_queue q
    where q.user_id = p_user_id
      and q.processed_at is null
    limit 1
  ) then
    return;
  end if;

  insert into public.recommendation_recompute_queue(user_id, reason)
  values (p_user_id, p_reason);
end;
$$;

revoke all on function public.enqueue_recommendation_recompute(uuid, text) from public;
revoke all on function public.enqueue_recommendation_recompute(uuid, text) from anon;
revoke all on function public.enqueue_recommendation_recompute(uuid, text) from authenticated;

create or replace function public.trg_enqueue_recommendations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_reason text;
begin
  v_uid := coalesce(new.user_id, old.user_id, new.id, old.id);
  v_reason := tg_table_name || ':' || tg_op;
  perform public.enqueue_recommendation_recompute(v_uid, v_reason);
  return coalesce(new, old);
end;
$$;

revoke all on function public.trg_enqueue_recommendations() from public;
revoke all on function public.trg_enqueue_recommendations() from anon;
revoke all on function public.trg_enqueue_recommendations() from authenticated;

-- Fire when interests change

drop trigger if exists trg_user_interests_enqueue_reco_ins on public.user_interests;
create trigger trg_user_interests_enqueue_reco_ins
after insert on public.user_interests
for each row execute function public.trg_enqueue_recommendations();

drop trigger if exists trg_user_interests_enqueue_reco_upd on public.user_interests;
create trigger trg_user_interests_enqueue_reco_upd
after update on public.user_interests
for each row execute function public.trg_enqueue_recommendations();

-- Fire when preferences change

drop trigger if exists trg_user_preferences_enqueue_reco_ins on public.user_preferences;
create trigger trg_user_preferences_enqueue_reco_ins
after insert on public.user_preferences
for each row execute function public.trg_enqueue_recommendations();

drop trigger if exists trg_user_preferences_enqueue_reco_upd on public.user_preferences;
create trigger trg_user_preferences_enqueue_reco_upd
after update on public.user_preferences
for each row execute function public.trg_enqueue_recommendations();

-- Fire when profile changes (age/gender/location/intent)

drop trigger if exists trg_profiles_enqueue_reco_upd on public.profiles;
create trigger trg_profiles_enqueue_reco_upd
after update of age, gender, location, intent on public.profiles
for each row execute function public.trg_enqueue_recommendations();

commit;
