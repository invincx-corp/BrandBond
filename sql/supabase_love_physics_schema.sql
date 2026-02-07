begin;

-- =========================================================
-- BrandBond: Love Physics (additive, opt-in, does not modify Pulse)
-- Implements:
-- - Dyad as first-class pocket (love_dyads)
-- - Intimacy mode opt-in per dyad
-- - Exclusive witnessing as mutual agreement (love_dyad_agreements)
-- - Ritual mutual reveals tied to dyad (love_ritual_*)
--
-- NOTE: Run manually in Supabase SQL editor (Option 1).
-- =========================================================

create extension if not exists pgcrypto;

-- --------------- Enum types ---------------

do $$ begin
  if not exists (select 1 from pg_type where typname = 'love_dyad_stage') then
    create type public.love_dyad_stage as enum ('seed', 'growing', 'bonded', 'intimate', 'exclusive');
  end if;
end $$;


do $$ begin
  if not exists (select 1 from pg_type where typname = 'love_dyad_status') then
    create type public.love_dyad_status as enum ('active', 'paused', 'closed');
  end if;
end $$;


do $$ begin
  if not exists (select 1 from pg_type where typname = 'love_agreement_type') then
    create type public.love_agreement_type as enum ('exclusive_witnessing');
  end if;
end $$;


do $$ begin
  if not exists (select 1 from pg_type where typname = 'love_ritual_thread_status') then
    create type public.love_ritual_thread_status as enum ('issued', 'awaiting_other', 'revealed', 'archived');
  end if;
end $$;

-- --------------- Settings (preference only) ---------------

create table if not exists public.love_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exclusive_mode_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.love_settings enable row level security;

drop policy if exists "love_settings_select_own" on public.love_settings;
create policy "love_settings_select_own"
on public.love_settings
for select
using (user_id = public.current_user_id());

drop policy if exists "love_settings_insert_own" on public.love_settings;
create policy "love_settings_insert_own"
on public.love_settings
for insert
with check (user_id = public.current_user_id());

drop policy if exists "love_settings_update_own" on public.love_settings;
create policy "love_settings_update_own"
on public.love_settings
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

-- --------------- Dyads ---------------

create table if not exists public.love_dyads (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  status public.love_dyad_status not null default 'active',
  stage public.love_dyad_stage not null default 'seed',
  intimacy_mode boolean not null default false,
  activated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_love_dyads_distinct check (user_low <> user_high),
  constraint ux_love_dyads_pair unique (user_low, user_high)
);

create index if not exists idx_love_dyads_user_low on public.love_dyads (user_low, updated_at desc);
create index if not exists idx_love_dyads_user_high on public.love_dyads (user_high, updated_at desc);

alter table public.love_dyads enable row level security;

drop policy if exists "love_dyads_select_participants" on public.love_dyads;
create policy "love_dyads_select_participants"
on public.love_dyads
for select
using (user_low = public.current_user_id() or user_high = public.current_user_id());

drop policy if exists "love_dyads_insert_participant" on public.love_dyads;
create policy "love_dyads_insert_participant"
on public.love_dyads
for insert
with check (user_low = public.current_user_id() or user_high = public.current_user_id());

drop policy if exists "love_dyads_update_participants" on public.love_dyads;
create policy "love_dyads_update_participants"
on public.love_dyads
for update
using (user_low = public.current_user_id() or user_high = public.current_user_id())
with check (user_low = public.current_user_id() or user_high = public.current_user_id());

-- --------------- Mutual agreements (exclusive witnessing) ---------------

create table if not exists public.love_dyad_agreements (
  id uuid primary key default gen_random_uuid(),
  dyad_id uuid not null references public.love_dyads(id) on delete cascade,
  agreement_type public.love_agreement_type not null default 'exclusive_witnessing',
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  accepted_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
  -- NOTE: Active agreement uniqueness is enforced via a partial unique index below.
);

create index if not exists idx_love_dyad_agreements_dyad on public.love_dyad_agreements (dyad_id, requested_at desc);

alter table public.love_dyad_agreements drop constraint if exists ux_love_dyad_agreements_active;
create unique index if not exists ux_love_dyad_agreements_active_idx
  on public.love_dyad_agreements (dyad_id, agreement_type)
  where revoked_at is null;

alter table public.love_dyad_agreements enable row level security;

drop policy if exists "love_dyad_agreements_select_participants" on public.love_dyad_agreements;
create policy "love_dyad_agreements_select_participants"
on public.love_dyad_agreements
for select
using (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

drop policy if exists "love_dyad_agreements_insert_participant" on public.love_dyad_agreements;
create policy "love_dyad_agreements_insert_participant"
on public.love_dyad_agreements
for insert
with check (
  requested_by = public.current_user_id()
  and exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

drop policy if exists "love_dyad_agreements_update_participants" on public.love_dyad_agreements;
create policy "love_dyad_agreements_update_participants"
on public.love_dyad_agreements
for update
using (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
)
with check (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

-- --------------- Ritual prompts + threads (dyad mutual reveals) ---------------

create table if not exists public.love_ritual_prompts (
  id uuid primary key default gen_random_uuid(),
  stage_min public.love_dyad_stage not null default 'seed',
  prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_love_ritual_prompts_stage on public.love_ritual_prompts (stage_min, created_at desc);

alter table public.love_ritual_prompts enable row level security;

drop policy if exists "love_ritual_prompts_select" on public.love_ritual_prompts;
create policy "love_ritual_prompts_select"
on public.love_ritual_prompts
for select
using (is_active = true);

create table if not exists public.love_ritual_threads (
  id uuid primary key default gen_random_uuid(),
  dyad_id uuid not null references public.love_dyads(id) on delete cascade,
  prompt_id uuid null references public.love_ritual_prompts(id) on delete set null,
  status public.love_ritual_thread_status not null default 'issued',
  issued_at timestamptz not null default now(),
  revealed_at timestamptz null,
  archived_at timestamptz null
);

create index if not exists idx_love_ritual_threads_dyad on public.love_ritual_threads (dyad_id, issued_at desc);

alter table public.love_ritual_threads enable row level security;

drop policy if exists "love_ritual_threads_select_participants" on public.love_ritual_threads;
create policy "love_ritual_threads_select_participants"
on public.love_ritual_threads
for select
using (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

drop policy if exists "love_ritual_threads_insert_participant" on public.love_ritual_threads;
create policy "love_ritual_threads_insert_participant"
on public.love_ritual_threads
for insert
with check (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

drop policy if exists "love_ritual_threads_update_participants" on public.love_ritual_threads;
create policy "love_ritual_threads_update_participants"
on public.love_ritual_threads
for update
using (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
)
with check (
  exists (
    select 1
    from public.love_dyads d
    where d.id = dyad_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

create table if not exists public.love_ritual_responses (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.love_ritual_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null,
  created_at timestamptz not null default now(),
  constraint ux_love_ritual_responses_unique unique (thread_id, user_id)
);

create index if not exists idx_love_ritual_responses_thread on public.love_ritual_responses (thread_id, created_at desc);

alter table public.love_ritual_responses enable row level security;

drop policy if exists "love_ritual_responses_insert_own" on public.love_ritual_responses;
create policy "love_ritual_responses_insert_own"
on public.love_ritual_responses
for insert
with check (
  user_id = public.current_user_id()
  and exists (
    select 1
    from public.love_ritual_threads t
    join public.love_dyads d on d.id = t.dyad_id
    where t.id = thread_id
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

drop policy if exists "love_ritual_responses_select_visible" on public.love_ritual_responses;
create policy "love_ritual_responses_select_visible"
on public.love_ritual_responses
for select
using (
  user_id = public.current_user_id()
  or exists (
    select 1
    from public.love_ritual_threads t
    join public.love_dyads d on d.id = t.dyad_id
    where t.id = thread_id
      and t.status = 'revealed'
      and (d.user_low = public.current_user_id() or d.user_high = public.current_user_id())
  )
);

-- --------------- RPCs ---------------

create or replace function public.love_get_or_create_dyad(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  a uuid;
  b uuid;
  did uuid;
begin
  me := public.current_user_id();
  if me is null then raise exception 'not_authenticated'; end if;
  if other_id is null or other_id = me then raise exception 'invalid_target'; end if;

  if not exists (
    select 1
    from public.matches m
    where m.status = 'accepted'
      and m.user_low = least(me, other_id)
      and m.user_high = greatest(me, other_id)
    limit 1
  ) then
    raise exception 'not_matched';
  end if;

  a := least(me, other_id);
  b := greatest(me, other_id);

  insert into public.love_dyads (user_low, user_high)
  values (a, b)
  on conflict (user_low, user_high) do update set updated_at = now()
  returning id into did;

  return did;
end;
$$;

revoke all on function public.love_get_or_create_dyad(uuid) from public;
revoke all on function public.love_get_or_create_dyad(uuid) from anon;
grant execute on function public.love_get_or_create_dyad(uuid) to authenticated;

create or replace function public.love_set_intimacy_mode(other_id uuid, enabled boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  did uuid;
begin
  did := public.love_get_or_create_dyad(other_id);

  update public.love_dyads
    set intimacy_mode = coalesce(enabled, false),
        activated_at = case when coalesce(enabled, false) then coalesce(activated_at, now()) else activated_at end,
        updated_at = now()
  where id = did;

  return did;
end;
$$;

revoke all on function public.love_set_intimacy_mode(uuid, boolean) from public;
revoke all on function public.love_set_intimacy_mode(uuid, boolean) from anon;
grant execute on function public.love_set_intimacy_mode(uuid, boolean) to authenticated;

create or replace function public.love_request_exclusive_witnessing(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  did uuid;
  existing uuid;
begin
  me := public.current_user_id();
  if me is null then raise exception 'not_authenticated'; end if;

  did := public.love_get_or_create_dyad(other_id);

  -- must be in intimacy mode to request exclusivity
  if not exists (select 1 from public.love_dyads d where d.id = did and d.intimacy_mode = true) then
    raise exception 'intimacy_mode_required';
  end if;

  select a.id into existing
  from public.love_dyad_agreements a
  where a.dyad_id = did
    and a.agreement_type = 'exclusive_witnessing'
    and a.revoked_at is null
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.love_dyad_agreements (dyad_id, agreement_type, requested_by)
  values (did, 'exclusive_witnessing', me)
  returning id into existing;

  return existing;
end;
$$;

revoke all on function public.love_request_exclusive_witnessing(uuid) from public;
revoke all on function public.love_request_exclusive_witnessing(uuid) from anon;
grant execute on function public.love_request_exclusive_witnessing(uuid) to authenticated;

create or replace function public.love_accept_exclusive_witnessing(agreement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  a record;
  d record;
begin
  me := public.current_user_id();
  if me is null then raise exception 'not_authenticated'; end if;

  select * into a
  from public.love_dyad_agreements
  where id = agreement_id and revoked_at is null;

  if not found then raise exception 'agreement_not_found'; end if;

  select * into d
  from public.love_dyads
  where id = a.dyad_id;

  if not found then raise exception 'dyad_not_found'; end if;

  if not (d.user_low = me or d.user_high = me) then raise exception 'not_participant'; end if;
  if a.requested_by = me then raise exception 'cannot_accept_own_request'; end if;

  update public.love_dyad_agreements
    set accepted_at = coalesce(accepted_at, now())
  where id = agreement_id;

  -- bump stage to exclusive (non-destructive; only when accepted)
  update public.love_dyads
    set stage = 'exclusive',
        updated_at = now()
  where id = a.dyad_id;
end;
$$;

revoke all on function public.love_accept_exclusive_witnessing(uuid) from public;
revoke all on function public.love_accept_exclusive_witnessing(uuid) from anon;
grant execute on function public.love_accept_exclusive_witnessing(uuid) to authenticated;

create or replace function public.love_revoke_exclusive_witnessing(agreement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  a record;
  d record;
begin
  me := public.current_user_id();
  if me is null then raise exception 'not_authenticated'; end if;

  select * into a
  from public.love_dyad_agreements
  where id = agreement_id and revoked_at is null;

  if not found then raise exception 'agreement_not_found'; end if;

  select * into d
  from public.love_dyads
  where id = a.dyad_id;

  if not found then raise exception 'dyad_not_found'; end if;

  if not (d.user_low = me or d.user_high = me) then raise exception 'not_participant'; end if;

  update public.love_dyad_agreements
    set revoked_at = now()
  where id = agreement_id;
end;
$$;

revoke all on function public.love_revoke_exclusive_witnessing(uuid) from public;
revoke all on function public.love_revoke_exclusive_witnessing(uuid) from anon;
grant execute on function public.love_revoke_exclusive_witnessing(uuid) to authenticated;

create or replace function public.love_issue_ritual_thread(other_id uuid, cooldown_hours int default 72)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  did uuid;
  d record;
  existing uuid;
  last_issued timestamptz;
  prompt uuid;
  created uuid;
  cd int;
begin
  me := public.current_user_id();
  if me is null then raise exception 'not_authenticated'; end if;

  did := public.love_get_or_create_dyad(other_id);

  select * into d from public.love_dyads where id = did;
  if not found then raise exception 'dyad_not_found'; end if;

  if d.intimacy_mode is distinct from true then
    raise exception 'intimacy_mode_required';
  end if;

  cd := greatest(1, least(coalesce(cooldown_hours, 72), 720));

  select max(issued_at) into last_issued
  from public.love_ritual_threads
  where dyad_id = did and archived_at is null;

  if last_issued is not null and last_issued > (now() - make_interval(hours => cd)) then
    raise exception 'cooldown_active';
  end if;

  select id into prompt
  from public.love_ritual_prompts
  where is_active = true
  order by random()
  limit 1;

  insert into public.love_ritual_threads (dyad_id, prompt_id, status)
  values (did, prompt, 'issued')
  returning id into created;

  return created;
end;
$$;

revoke all on function public.love_issue_ritual_thread(uuid, int) from public;
revoke all on function public.love_issue_ritual_thread(uuid, int) from anon;
grant execute on function public.love_issue_ritual_thread(uuid, int) to authenticated;

create or replace function public.love_submit_ritual_response(thread_uuid uuid, response_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  t record;
  d record;
  total_responses int;
begin
  me := public.current_user_id();
  if me is null then raise exception 'not_authenticated'; end if;
  if thread_uuid is null then raise exception 'invalid_thread'; end if;
  if response_text is null or length(trim(response_text)) = 0 then raise exception 'empty_response'; end if;

  select * into t
  from public.love_ritual_threads
  where id = thread_uuid;

  if not found then raise exception 'thread_not_found'; end if;

  select * into d
  from public.love_dyads
  where id = t.dyad_id;

  if not found then raise exception 'dyad_not_found'; end if;

  if not (d.user_low = me or d.user_high = me) then raise exception 'not_participant'; end if;

  insert into public.love_ritual_responses (thread_id, user_id, response)
  values (thread_uuid, me, trim(response_text))
  on conflict (thread_id, user_id) do update set response = excluded.response;

  select count(*) into total_responses
  from public.love_ritual_responses
  where thread_id = thread_uuid;

  if total_responses >= 2 then
    update public.love_ritual_threads
      set status = 'revealed', revealed_at = coalesce(revealed_at, now())
      where id = thread_uuid;
  else
    update public.love_ritual_threads
      set status = 'awaiting_other'
      where id = thread_uuid and status <> 'revealed';
  end if;
end;
$$;

revoke all on function public.love_submit_ritual_response(uuid, text) from public;
revoke all on function public.love_submit_ritual_response(uuid, text) from anon;
grant execute on function public.love_submit_ritual_response(uuid, text) to authenticated;

-- Seed a minimal romantic prompt pack (stage-gated expansions can be added later).
insert into public.love_ritual_prompts (stage_min, prompt, is_active)
select x.stage_min, x.prompt, true
from (
  values
    ('seed'::public.love_dyad_stage, 'What do you quietly hope I understand about you without you having to perform it?'),
    ('growing'::public.love_dyad_stage, 'What are you afraid to want, even though it feels true?'),
    ('bonded'::public.love_dyad_stage, 'What is a habit you only show when you feel safe?'),
    ('intimate'::public.love_dyad_stage, 'What kind of love did you need earlier in life that you are learning to ask for now?')
) as x(stage_min, prompt)
where not exists (
  select 1 from public.love_ritual_prompts
);

commit;
