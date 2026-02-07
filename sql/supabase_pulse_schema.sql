begin;

-- =========================================================
-- BrandBond: Pulse (soft social, no DMs)
-- =========================================================

create extension if not exists pgcrypto;

-- --------------- Enum types ---------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulse_visibility') then
    create type public.pulse_visibility as enum ('public', 'orbit', 'mutual', 'private');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulse_universe') then
    create type public.pulse_universe as enum ('love', 'friends', 'both');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulse_post_type') then
    create type public.pulse_post_type as enum (
      'daily_vibe',
      'enrich_favorite',
      'habit_mood',
      'thought_seed',
      'space_response',
      'quiet_note'
    );
  end if;
end $$;

-- Reaction verbs are intentionally constrained (no comment threads)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulse_reaction_type') then
    create type public.pulse_reaction_type as enum (
      'felt_that',
      'same',
      'warmth',
      'nudge',
      'stayed_with_me',
      'relatable',
      'respectful_disagree',
      'noticed_you_again'
    );
  end if;
end $$;

-- Richer curiosity signals (beyond views/reactions)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulse_signal_type') then
    create type public.pulse_signal_type as enum (
      'open_post',
      'dwell',
      'reaction_added',
      'reaction_removed',
      'copy_link',
      'open_spaces_sheet',
      'respond_space_prompt_clicked'
    );
  end if;
end $$;

-- --------------- Core tables ---------------

-- Pulse posts are "moments". They can expire and are not threads.
create table if not exists public.pulse_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid null references auth.users(id) on delete set null,
  universe public.pulse_universe not null default 'both',
  visibility public.pulse_visibility not null default 'orbit',
  type public.pulse_post_type not null,

  -- UI payload. Keep flexible while product evolves.
  content jsonb not null default '{}'::jsonb,

  -- Optional anchoring to other primitives.
  space_id uuid null,
  favorite_id uuid null,

  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  deleted_at timestamptz null
);

create index if not exists idx_pulse_posts_created_at
  on public.pulse_posts (created_at desc);

create index if not exists idx_pulse_posts_user_created
  on public.pulse_posts (user_id, created_at desc);

create index if not exists idx_pulse_posts_target_user_created
  on public.pulse_posts (target_user_id, created_at desc);

create index if not exists idx_pulse_posts_visibility
  on public.pulse_posts (visibility);

create index if not exists idx_pulse_posts_universe
  on public.pulse_posts (universe);

create index if not exists idx_pulse_posts_expires_at
  on public.pulse_posts (expires_at);

-- One reaction per user per post per reaction-type (toggle semantics).
create table if not exists public.pulse_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.pulse_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction public.pulse_reaction_type not null,
  created_at timestamptz not null default now(),
  constraint ux_pulse_reactions_unique unique (post_id, user_id, reaction)
);

create index if not exists idx_pulse_reactions_post_created
  on public.pulse_reactions (post_id, created_at desc);

create index if not exists idx_pulse_reactions_user_created
  on public.pulse_reactions (user_id, created_at desc);

-- Views are the raw signal for curiosity + orbit (lingers can be added later).
create table if not exists public.pulse_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.pulse_posts(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  dwell_ms int null,
  constraint ux_pulse_views_unique unique (post_id, viewer_id)
);

create index if not exists idx_pulse_views_viewer
  on public.pulse_views (viewer_id, viewed_at desc);

create index if not exists idx_pulse_views_post
  on public.pulse_views (post_id, viewed_at desc);

-- Signals are a flexible event stream for Soul Graph + Curiosity Loop.
create table if not exists public.pulse_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  universe public.pulse_universe not null default 'both',
  signal public.pulse_signal_type not null,
  post_id uuid null references public.pulse_posts(id) on delete set null,
  target_user_id uuid null references auth.users(id) on delete set null,
  space_id uuid null references public.pulse_spaces(id) on delete set null,
  prompt_id uuid null references public.pulse_space_prompts(id) on delete set null,
  reaction public.pulse_reaction_type null,
  dwell_ms int null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_pulse_signals_user_created
  on public.pulse_signals (user_id, created_at desc);

create index if not exists idx_pulse_signals_post
  on public.pulse_signals (post_id, created_at desc);

create index if not exists idx_pulse_signals_target
  on public.pulse_signals (target_user_id, created_at desc);

-- Orbit is an explicit cache table for "recurring presence".
-- The app can update it; later you can move it to triggers/materialized view.
create table if not exists public.pulse_orbit (
  owner_id uuid not null references auth.users(id) on delete cascade,
  other_user_id uuid not null references auth.users(id) on delete cascade,
  score int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_id, other_user_id)
);

-- gentle acknowledgments (dyad-only, non-counting)

create table if not exists public.pulse_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  universe public.pulse_universe not null default 'love',
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'warmth',
  message text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

create index if not exists idx_pulse_ack_from_created
  on public.pulse_acknowledgments (from_user_id, created_at desc);

create index if not exists idx_pulse_ack_to_created
  on public.pulse_acknowledgments (to_user_id, created_at desc);

alter table public.pulse_acknowledgments enable row level security;

create index if not exists idx_pulse_orbit_owner_score
  on public.pulse_orbit (owner_id, score desc, updated_at desc);

-- Mutual reveals: a lightweight unlock mechanism (no DMs)
create table if not exists public.pulse_reveals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chk_pulse_reveals_distinct check (user_id <> target_user_id),
  constraint ux_pulse_reveals_unique unique (user_id, target_user_id)
);

create index if not exists idx_pulse_reveals_user_created
  on public.pulse_reveals (user_id, created_at desc);

create index if not exists idx_pulse_reveals_target_created
  on public.pulse_reveals (target_user_id, created_at desc);

-- =========================================================
-- Mutual Reveal (handshake protocol, love-only)
-- "eligible" (by orbit) -> thread issued -> both respond -> revealed
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulse_reveal_thread_status') then
    create type public.pulse_reveal_thread_status as enum (
      'issued',
      'awaiting_other',
      'revealed',
      'archived'
    );
  end if;
end $$;

create table if not exists public.pulse_reveal_prompts (
  id uuid primary key default gen_random_uuid(),
  universe public.pulse_universe not null default 'love',
  prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_pulse_reveal_prompts_universe
  on public.pulse_reveal_prompts (universe, created_at desc);

create table if not exists public.pulse_reveal_threads (
  id uuid primary key default gen_random_uuid(),
  universe public.pulse_universe not null default 'love',
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid null references public.pulse_reveal_prompts(id) on delete set null,
  status public.pulse_reveal_thread_status not null default 'issued',
  issued_at timestamptz not null default now(),
  revealed_at timestamptz null,
  archived_at timestamptz null,
  constraint chk_pulse_reveal_threads_distinct check (user_a_id <> user_b_id)
);

-- One active thread per pair per universe (enforced at app level; DB uniqueness via generated least/greatest would be nicer but keep simple)
create index if not exists idx_pulse_reveal_threads_users
  on public.pulse_reveal_threads (user_a_id, user_b_id, issued_at desc);

create table if not exists public.pulse_reveal_responses (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.pulse_reveal_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null,
  created_at timestamptz not null default now(),
  constraint ux_pulse_reveal_responses_unique unique (thread_id, user_id)
);

create index if not exists idx_pulse_reveal_responses_thread
  on public.pulse_reveal_responses (thread_id, created_at desc);

-- --------------- RLS for reveal handshake ---------------

alter table public.pulse_reveal_prompts enable row level security;
alter table public.pulse_reveal_threads enable row level security;
alter table public.pulse_reveal_responses enable row level security;

drop policy if exists "pulse_reveal_prompts_select" on public.pulse_reveal_prompts;
create policy "pulse_reveal_prompts_select"
on public.pulse_reveal_prompts
for select
using (is_active = true);

drop policy if exists "pulse_reveal_threads_select_participants" on public.pulse_reveal_threads;
create policy "pulse_reveal_threads_select_participants"
on public.pulse_reveal_threads
for select
using (
  universe = 'love'
  and (user_a_id = public.current_user_id() or user_b_id = public.current_user_id())
);

drop policy if exists "pulse_reveal_threads_insert_participant" on public.pulse_reveal_threads;
create policy "pulse_reveal_threads_insert_participant"
on public.pulse_reveal_threads
for insert
with check (
  universe = 'love'
  and (user_a_id = public.current_user_id() or user_b_id = public.current_user_id())
);

drop policy if exists "pulse_reveal_threads_update_participants" on public.pulse_reveal_threads;
create policy "pulse_reveal_threads_update_participants"
on public.pulse_reveal_threads
for update
using (universe = 'love' and (user_a_id = public.current_user_id() or user_b_id = public.current_user_id()))
with check (universe = 'love' and (user_a_id = public.current_user_id() or user_b_id = public.current_user_id()));

drop policy if exists "pulse_reveal_responses_insert_own" on public.pulse_reveal_responses;
create policy "pulse_reveal_responses_insert_own"
on public.pulse_reveal_responses
for insert
with check (
  user_id = public.current_user_id()
  and exists (
    select 1
    from public.pulse_reveal_threads t
    where t.id = thread_id
      and t.universe = 'love'
      and (t.user_a_id = public.current_user_id() or t.user_b_id = public.current_user_id())
  )
);

drop policy if exists "pulse_reveal_responses_select_revealed_or_own" on public.pulse_reveal_responses;
create policy "pulse_reveal_responses_select_revealed_or_own"
on public.pulse_reveal_responses
for select
using (
  user_id = public.current_user_id()
  or exists (
    select 1
    from public.pulse_reveal_threads t
    where t.id = thread_id
      and t.universe = 'love'
      and t.status = 'revealed'
      and (t.user_a_id = public.current_user_id() or t.user_b_id = public.current_user_id())
  )
);

-- --------------- RPCs ---------------

create or replace function public.issue_mutual_reveal_thread(
  other_id uuid,
  min_score int default 8,
  cooldown_hours int default 72
)
returns uuid
language plpgsql
security definer
as $$
declare
  me uuid;
  a uuid;
  b uuid;
  prompt uuid;
  existing uuid;
  last_revealed timestamptz;
  my_score int;
  their_score int;
begin
  me := public.current_user_id();
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if other_id is null or other_id = me then
    raise exception 'invalid_target';
  end if;

  select coalesce(score, 0) into my_score
  from public.pulse_orbit
  where owner_id = me and other_user_id = other_id;

  select coalesce(score, 0) into their_score
  from public.pulse_orbit
  where owner_id = other_id and other_user_id = me;

  if my_score < min_score or their_score < min_score then
    raise exception 'not_eligible';
  end if;

  a := least(me, other_id);
  b := greatest(me, other_id);

  select id into existing
  from public.pulse_reveal_threads
  where universe = 'love'
    and user_a_id = a
    and user_b_id = b
    and archived_at is null
  order by issued_at desc
  limit 1;

  if existing is not null then
    return existing;
  end if;

  select revealed_at into last_revealed
  from public.pulse_reveal_threads
  where universe = 'love'
    and user_a_id = a
    and user_b_id = b
    and revealed_at is not null
  order by revealed_at desc
  limit 1;

  if last_revealed is not null and last_revealed > (now() - make_interval(hours => cooldown_hours)) then
    raise exception 'cooldown_active';
  end if;

  select id into prompt
  from public.pulse_reveal_prompts
  where is_active = true and universe = 'love'
  order by random()
  limit 1;

  insert into public.pulse_reveal_threads (universe, user_a_id, user_b_id, prompt_id, status)
  values ('love', a, b, prompt, 'issued')
  returning id into existing;

  return existing;
end;
$$;

create or replace function public.send_pulse_acknowledgment(
  to_id uuid,
  kind text default 'warmth',
  message text default null,
  cooldown_minutes int default 30
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  last_sent timestamptz;
  created uuid;
  cleaned_kind text;
  cleaned_message text;
begin
  me := public.current_user_id();
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if to_id is null or to_id = me then
    raise exception 'invalid_target';
  end if;

  if not exists (
    select 1
    from public.matches m
    where m.status = 'accepted'
      and m.user_low = least(me, to_id)
      and m.user_high = greatest(me, to_id)
    limit 1
  ) then
    raise exception 'not_matched';
  end if;

  select max(created_at) into last_sent
  from public.pulse_acknowledgments
  where from_user_id = me and to_user_id = to_id;

  if last_sent is not null and last_sent > (now() - make_interval(mins => cooldown_minutes)) then
    raise exception 'cooldown_active';
  end if;

  cleaned_kind := left(coalesce(nullif(trim(kind), ''), 'warmth'), 32);
  cleaned_message := null;
  if message is not null and length(trim(message)) > 0 then
    cleaned_message := left(trim(message), 140);
  end if;

  insert into public.pulse_acknowledgments (universe, from_user_id, to_user_id, kind, message, expires_at)
  values ('love', me, to_id, cleaned_kind, cleaned_message, (now() + make_interval(days => 14)))
  returning id into created;

  return created;
end;
$$;

create or replace function public.get_love_dyad_resonance(
  other_id uuid,
  days_back int default 30
)
returns table(day date, score int)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  d int;
begin
  me := public.current_user_id();
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if other_id is null or other_id = me then
    raise exception 'invalid_target';
  end if;

  d := greatest(1, least(coalesce(days_back, 30), 90));

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

  return query
  with days as (
    select generate_series((current_date - (d - 1))::date, current_date::date, interval '1 day')::date as day
  ),
  posts as (
    select date_trunc('day', p.created_at)::date as day,
           count(*)::int as cnt
    from public.pulse_posts p
    where p.universe = 'love'
      and p.visibility = 'private'
      and p.deleted_at is null
      and p.created_at >= (now() - make_interval(days => d))
      and (
        (p.user_id = me and p.target_user_id = other_id)
        or (p.user_id = other_id and p.target_user_id = me)
      )
    group by 1
  ),
  acks as (
    select date_trunc('day', a.created_at)::date as day,
           count(*)::int as cnt
    from public.pulse_acknowledgments a
    where a.universe = 'love'
      and a.created_at >= (now() - make_interval(days => d))
      and (
        (a.from_user_id = me and a.to_user_id = other_id)
        or (a.from_user_id = other_id and a.to_user_id = me)
      )
    group by 1
  )
  select
    days.day,
    least(100, greatest(0, coalesce(posts.cnt, 0) * 12 + coalesce(acks.cnt, 0) * 6))::int as score
  from days
  left join posts on posts.day = days.day
  left join acks on acks.day = days.day
  order by days.day asc;
end;
$$;

revoke all on function public.get_love_dyad_resonance(uuid, int) from public;
revoke all on function public.get_love_dyad_resonance(uuid, int) from anon;
grant execute on function public.get_love_dyad_resonance(uuid, int) to authenticated;

create or replace function public.issue_mutual_recommendation_reveal_thread(
  other_id uuid,
  cooldown_hours int default 72
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  a uuid;
  b uuid;
  prompt uuid;
  existing uuid;
  last_revealed timestamptz;
begin
  me := public.current_user_id();
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if other_id is null or other_id = me then
    raise exception 'invalid_target';
  end if;

  if not exists (
    select 1
    from public.match_recommendations r
    where r.user_id = me
      and r.recommended_user_id = other_id
      and r.status = 'active'
    limit 1
  ) then
    raise exception 'not_eligible';
  end if;

  if not exists (
    select 1
    from public.match_recommendations r
    where r.user_id = other_id
      and r.recommended_user_id = me
      and r.status = 'active'
    limit 1
  ) then
    raise exception 'not_eligible';
  end if;

  a := least(me, other_id);
  b := greatest(me, other_id);

  select id into existing
  from public.pulse_reveal_threads
  where universe = 'love'
    and user_a_id = a
    and user_b_id = b
    and archived_at is null
  order by issued_at desc
  limit 1;

  if existing is not null then
    return existing;
  end if;

  select revealed_at into last_revealed
  from public.pulse_reveal_threads
  where universe = 'love'
    and user_a_id = a
    and user_b_id = b
    and revealed_at is not null
  order by revealed_at desc
  limit 1;

  if last_revealed is not null and last_revealed > (now() - make_interval(hours => cooldown_hours)) then
    raise exception 'cooldown_active';
  end if;

  select id into prompt
  from public.pulse_reveal_prompts
  where is_active = true and universe = 'love'
  order by random()
  limit 1;

  insert into public.pulse_reveal_threads (universe, user_a_id, user_b_id, prompt_id, status)
  values ('love', a, b, prompt, 'issued')
  returning id into existing;

  return existing;
end;
$$;

create or replace function public.submit_mutual_reveal_response(
  thread_uuid uuid,
  response_text text
)
returns void
language plpgsql
security definer
as $$
declare
  me uuid;
  t record;
  total_responses int;
begin
  me := public.current_user_id();
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if thread_uuid is null then
    raise exception 'invalid_thread';
  end if;
  if response_text is null or length(trim(response_text)) = 0 then
    raise exception 'empty_response';
  end if;

  select * into t
  from public.pulse_reveal_threads
  where id = thread_uuid and universe = 'love';

  if not found then
    raise exception 'thread_not_found';
  end if;

  if not (t.user_a_id = me or t.user_b_id = me) then
    raise exception 'not_participant';
  end if;

  insert into public.pulse_reveal_responses (thread_id, user_id, response)
  values (thread_uuid, me, trim(response_text))
  on conflict (thread_id, user_id) do update set response = excluded.response;

  select count(*) into total_responses
  from public.pulse_reveal_responses
  where thread_id = thread_uuid;

  if total_responses >= 2 then
    update public.pulse_reveal_threads
      set status = 'revealed', revealed_at = coalesce(revealed_at, now())
      where id = thread_uuid;
  else
    update public.pulse_reveal_threads
      set status = 'awaiting_other'
      where id = thread_uuid and status <> 'revealed';
  end if;
end;
$$;

-- Seed minimal prompts for love universe (placeholder until activity-derived prompts ship)
insert into public.pulse_reveal_prompts (universe, prompt, is_active)
select 'love', p.prompt, true
from (
  values
    ('What’s a small way you’ve been trying to grow lately?'),
    ('What kind of care do you give that people often miss?'),
    ('What’s a truth about you that’s gentle, not performative?')
) as p(prompt)
where not exists (
  select 1 from public.pulse_reveal_prompts where universe = 'love'
);

-- Friends-only Spaces (shared prompts + lightweight community layer)
create table if not exists public.pulse_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ux_pulse_spaces_name unique (name)
);

create table if not exists public.pulse_space_prompts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.pulse_spaces(id) on delete cascade,
  prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_pulse_space_prompts_space
  on public.pulse_space_prompts (space_id, created_at desc);

create table if not exists public.pulse_space_memberships (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.pulse_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint ux_pulse_space_memberships_unique unique (space_id, user_id)
);

create index if not exists idx_pulse_space_memberships_user
  on public.pulse_space_memberships (user_id, created_at desc);

create table if not exists public.pulse_space_responses (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.pulse_spaces(id) on delete cascade,
  prompt_id uuid null references public.pulse_space_prompts(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null,
  created_at timestamptz not null default now(),
  visibility public.pulse_visibility not null default 'orbit',
  pulse_post_id uuid null references public.pulse_posts(id) on delete set null
);

create index if not exists idx_pulse_space_responses_space_created
  on public.pulse_space_responses (space_id, created_at desc);

create index if not exists idx_pulse_space_responses_user_created
  on public.pulse_space_responses (user_id, created_at desc);

-- --------------- RLS ---------------

alter table public.pulse_posts enable row level security;
alter table public.pulse_reactions enable row level security;
alter table public.pulse_views enable row level security;
alter table public.pulse_orbit enable row level security;
alter table public.pulse_signals enable row level security;
alter table public.pulse_reveals enable row level security;
alter table public.pulse_spaces enable row level security;
alter table public.pulse_space_prompts enable row level security;
alter table public.pulse_space_memberships enable row level security;
alter table public.pulse_space_responses enable row level security;

-- pulse_posts

drop policy if exists "pulse_posts_select_visible" on public.pulse_posts;
create policy "pulse_posts_select_visible"
on public.pulse_posts
for select
using (
  deleted_at is null
  and (expires_at is null or expires_at > now())
  and (
    user_id = public.current_user_id()
    or visibility = 'public'
    -- For now: allow reading orbit/mutual posts globally. The app will filter.
    -- Tighten later once orbit/mutual membership is fully defined.
    or visibility in ('orbit', 'mutual')
    or (
      universe = 'love'
      and visibility = 'private'
      and target_user_id is not null
      and (user_id = public.current_user_id() or target_user_id = public.current_user_id())
      and exists (
        select 1
        from public.matches m
        where m.status = 'accepted'
          and m.user_low = least(user_id, target_user_id)
          and m.user_high = greatest(user_id, target_user_id)
      )
    )
  )
);

drop policy if exists "pulse_posts_insert_own" on public.pulse_posts;
create policy "pulse_posts_insert_own"
on public.pulse_posts
for insert
with check (
  user_id = public.current_user_id()
  and (
    universe <> 'love'
    or visibility <> 'private'
    or (
      target_user_id is not null
      and target_user_id <> user_id
      and exists (
        select 1
        from public.matches m
        where m.status = 'accepted'
          and m.user_low = least(user_id, target_user_id)
          and m.user_high = greatest(user_id, target_user_id)
      )
    )
  )
);

drop policy if exists "pulse_posts_update_own" on public.pulse_posts;
create policy "pulse_posts_update_own"
on public.pulse_posts
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

drop policy if exists "pulse_posts_delete_own" on public.pulse_posts;
create policy "pulse_posts_delete_own"
on public.pulse_posts
for delete
using (user_id = public.current_user_id());

-- pulse_reactions

drop policy if exists "pulse_reactions_select_visible" on public.pulse_reactions;
create policy "pulse_reactions_select_visible"
on public.pulse_reactions
for select
using (
  exists (
    select 1
    from public.pulse_posts p
    where p.id = post_id
      and p.deleted_at is null
      and (p.expires_at is null or p.expires_at > now())
      and (
        p.user_id = public.current_user_id()
        or p.visibility = 'public'
        or p.visibility in ('orbit', 'mutual')
      )
  )
);

drop policy if exists "pulse_reactions_insert_self" on public.pulse_reactions;
create policy "pulse_reactions_insert_self"
on public.pulse_reactions
for insert
with check (
  user_id = public.current_user_id()
  and exists (
    select 1
    from public.pulse_posts p
    where p.id = post_id
      and p.deleted_at is null
      and (p.expires_at is null or p.expires_at > now())
      and p.visibility <> 'private'
  )
);

drop policy if exists "pulse_reactions_delete_self" on public.pulse_reactions;
create policy "pulse_reactions_delete_self"
on public.pulse_reactions
for delete
using (user_id = public.current_user_id());

-- pulse_views

drop policy if exists "pulse_views_select_self" on public.pulse_views;
create policy "pulse_views_select_self"
on public.pulse_views
for select
using (viewer_id = public.current_user_id());

drop policy if exists "pulse_views_upsert_self" on public.pulse_views;
create policy "pulse_views_upsert_self"
on public.pulse_views
for insert
with check (
  viewer_id = public.current_user_id()
  and exists (
    select 1
    from public.pulse_posts p
    where p.id = post_id
      and p.deleted_at is null
      and (p.expires_at is null or p.expires_at > now())
      and p.visibility <> 'private'
  )
);

drop policy if exists "pulse_views_update_self" on public.pulse_views;
create policy "pulse_views_update_self"
on public.pulse_views
for update
using (viewer_id = public.current_user_id())
with check (viewer_id = public.current_user_id());

-- pulse_signals

drop policy if exists "pulse_signals_select_self" on public.pulse_signals;
create policy "pulse_signals_select_self"
on public.pulse_signals
for select
using (user_id = public.current_user_id());

drop policy if exists "pulse_signals_insert_self" on public.pulse_signals;
create policy "pulse_signals_insert_self"
on public.pulse_signals
for insert
with check (user_id = public.current_user_id());

drop policy if exists "pulse_signals_update_self" on public.pulse_signals;
create policy "pulse_signals_update_self"
on public.pulse_signals
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

drop policy if exists "pulse_signals_delete_self" on public.pulse_signals;
create policy "pulse_signals_delete_self"
on public.pulse_signals
for delete
using (user_id = public.current_user_id());

-- pulse_orbit

drop policy if exists "pulse_orbit_select_self" on public.pulse_orbit;
create policy "pulse_orbit_select_self"
on public.pulse_orbit
for select
using (owner_id = public.current_user_id());

drop policy if exists "pulse_orbit_upsert_self" on public.pulse_orbit;
create policy "pulse_orbit_upsert_self"
on public.pulse_orbit
for insert
with check (owner_id = public.current_user_id());

-- pulse_acknowledgments

drop policy if exists "pulse_acknowledgments_select_participants" on public.pulse_acknowledgments;
create policy "pulse_acknowledgments_select_participants"
on public.pulse_acknowledgments
for select
using (
  from_user_id = public.current_user_id()
  or to_user_id = public.current_user_id()
);

drop policy if exists "pulse_acknowledgments_insert_self" on public.pulse_acknowledgments;
create policy "pulse_acknowledgments_insert_self"
on public.pulse_acknowledgments
for insert
with check (
  from_user_id = public.current_user_id()
  and universe = 'love'
  and exists (
    select 1
    from public.matches m
    where m.status = 'accepted'
      and m.user_low = least(public.current_user_id(), to_user_id)
      and m.user_high = greatest(public.current_user_id(), to_user_id)
  )
);

drop policy if exists "pulse_orbit_update_self" on public.pulse_orbit;
create policy "pulse_orbit_update_self"
on public.pulse_orbit
for update
using (owner_id = public.current_user_id())
with check (owner_id = public.current_user_id());

-- pulse_reveals

drop policy if exists "pulse_reveals_select_self" on public.pulse_reveals;
create policy "pulse_reveals_select_self"
on public.pulse_reveals
for select
using (user_id = public.current_user_id() or target_user_id = public.current_user_id());

drop policy if exists "pulse_reveals_insert_self" on public.pulse_reveals;
create policy "pulse_reveals_insert_self"
on public.pulse_reveals
for insert
with check (user_id = public.current_user_id());

-- pulse_spaces

drop policy if exists "pulse_spaces_select_active" on public.pulse_spaces;
create policy "pulse_spaces_select_active"
on public.pulse_spaces
for select
using (is_active = true);

-- pulse_space_prompts

drop policy if exists "pulse_space_prompts_select_active" on public.pulse_space_prompts;
create policy "pulse_space_prompts_select_active"
on public.pulse_space_prompts
for select
using (
  is_active = true
  and exists (select 1 from public.pulse_spaces s where s.id = space_id and s.is_active = true)
);

-- pulse_space_memberships

drop policy if exists "pulse_space_memberships_select_self" on public.pulse_space_memberships;
create policy "pulse_space_memberships_select_self"
on public.pulse_space_memberships
for select
using (user_id = public.current_user_id());

drop policy if exists "pulse_space_memberships_insert_self" on public.pulse_space_memberships;
create policy "pulse_space_memberships_insert_self"
on public.pulse_space_memberships
for insert
with check (user_id = public.current_user_id());

drop policy if exists "pulse_space_memberships_delete_self" on public.pulse_space_memberships;
create policy "pulse_space_memberships_delete_self"
on public.pulse_space_memberships
for delete
using (user_id = public.current_user_id());

-- pulse_space_responses

drop policy if exists "pulse_space_responses_select_visible" on public.pulse_space_responses;
create policy "pulse_space_responses_select_visible"
on public.pulse_space_responses
for select
using (
  exists (
    select 1
    from public.pulse_posts p
    where p.id = pulse_post_id
      and p.deleted_at is null
      and (p.expires_at is null or p.expires_at > now())
      and (
        p.user_id = public.current_user_id()
        or p.visibility = 'public'
        or p.visibility in ('orbit', 'mutual')
      )
  )
);

drop policy if exists "pulse_space_responses_insert_self" on public.pulse_space_responses;
create policy "pulse_space_responses_insert_self"
on public.pulse_space_responses
for insert
with check (user_id = public.current_user_id());

drop policy if exists "pulse_space_responses_update_self" on public.pulse_space_responses;
create policy "pulse_space_responses_update_self"
on public.pulse_space_responses
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

-- Helper: check if a mutual reveal is unlocked for current user vs a target.
create or replace function public.is_mutual_reveal_unlocked(target uuid, threshold int default 10)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.pulse_orbit a
      where a.owner_id = public.current_user_id()
        and a.other_user_id = target
        and a.score >= threshold
    )
    and exists (
      select 1
      from public.pulse_orbit b
      where b.owner_id = target
        and b.other_user_id = public.current_user_id()
        and b.score >= threshold
    );
$$;

grant execute on function public.is_mutual_reveal_unlocked(uuid, int) to anon, authenticated;

create or replace function public.maybe_create_pulse_reveal(target uuid, threshold int default 10)
returns public.pulse_reveals
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pulse_reveals;
begin
  if not public.is_mutual_reveal_unlocked(target, threshold) then
    raise exception 'Mutual reveal not unlocked';
  end if;

  insert into public.pulse_reveals (user_id, target_user_id)
  values (public.current_user_id(), target)
  on conflict (user_id, target_user_id)
  do update set created_at = excluded.created_at
  returning * into rec;

  return rec;
end;
$$;

grant execute on function public.maybe_create_pulse_reveal(uuid, int) to anon, authenticated;

-- Seed a few default friend spaces + prompts
insert into public.pulse_spaces (name, description)
values
  ('Late-night thinkers', 'For people who process after midnight.'),
  ('Building quietly', 'Slow progress, steady presence.'),
  ('Rebuilding routines', 'Tiny habits, gentle accountability.')
on conflict (name) do nothing;

insert into public.pulse_space_prompts (space_id, prompt)
select s.id, p.prompt
from public.pulse_spaces s
join (
  values
    ('Late-night thinkers', 'What''s the thought you keep circling back to lately?'),
    ('Late-night thinkers', 'What feels easier to say at night than in the day?'),
    ('Building quietly', 'What are you building that almost no one sees?'),
    ('Building quietly', 'What would make today feel like a tiny win?'),
    ('Rebuilding routines', 'Which routine are you trying to return to, gently?'),
    ('Rebuilding routines', 'What helps you restart when you slip?')
) as p(space_name, prompt)
  on p.space_name = s.name
on conflict do nothing;

commit;
