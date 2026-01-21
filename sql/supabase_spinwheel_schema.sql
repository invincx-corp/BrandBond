begin;

create extension if not exists pgcrypto;

-- Persisted spin results so both users see the same "who makes first move" outcome.
create table if not exists public.spinwheel_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,

  user_low_score integer not null,
  user_high_score integer not null,
  first_move_by uuid not null references auth.users(id) on delete cascade,

  created_at timestamptz not null default now(),

  constraint chk_spin_scores_range check (user_low_score >= 1 and user_low_score <= 100 and user_high_score >= 1 and user_high_score <= 100),
  constraint chk_spin_users_distinct check (user_low <> user_high)
);

create index if not exists idx_spinwheel_match_created
  on public.spinwheel_results (match_id, created_at desc);

alter table public.spinwheel_results enable row level security;

drop policy if exists "spinwheel_results_select_participants" on public.spinwheel_results;
create policy "spinwheel_results_select_participants"
  on public.spinwheel_results
  for select
  using (user_low = public.current_user_id() or user_high = public.current_user_id());

drop policy if exists "spinwheel_results_insert_participants" on public.spinwheel_results;
create policy "spinwheel_results_insert_participants"
  on public.spinwheel_results
  for insert
  with check (
    created_by = public.current_user_id()
    and (user_low = public.current_user_id() or user_high = public.current_user_id())
  );

-- Convenience RPC: creates a single canonical result per match.
-- If a result already exists, returns the latest one.
create or replace function public.create_or_get_spinwheel_result(p_match_id uuid)
returns public.spinwheel_results
language plpgsql
security definer
as $$
declare
  v_match record;
  v_existing public.spinwheel_results;
  v_low_score integer;
  v_high_score integer;
  v_first_move uuid;
  v_inserted public.spinwheel_results;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, user_low, user_high
    into v_match
  from public.matches
  where id = p_match_id
    and (user_low = auth.uid() or user_high = auth.uid())
  limit 1;

  if v_match.id is null then
    raise exception 'Match not found or not permitted';
  end if;

  select * into v_existing
  from public.spinwheel_results
  where match_id = p_match_id
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    return v_existing;
  end if;

  v_low_score := floor(random() * 100 + 1);
  v_high_score := floor(random() * 100 + 1);

  if v_low_score <= v_high_score then
    v_first_move := v_match.user_low;
  else
    v_first_move := v_match.user_high;
  end if;

  insert into public.spinwheel_results (
    match_id,
    created_by,
    user_low,
    user_high,
    user_low_score,
    user_high_score,
    first_move_by
  )
  values (
    p_match_id,
    auth.uid(),
    v_match.user_low,
    v_match.user_high,
    v_low_score,
    v_high_score,
    v_first_move
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;

revoke all on function public.create_or_get_spinwheel_result(uuid) from public;
grant execute on function public.create_or_get_spinwheel_result(uuid) to authenticated;

commit;
