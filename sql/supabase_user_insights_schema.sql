begin;

create table if not exists public.user_insights (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_interests text[] not null default '{}'::text[],
  personality_traits text[] not null default '{}'::text[],
  lifestyle_patterns text[] not null default '{}'::text[],
  compatibility_trends jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_insights_updated
  on public.user_insights (updated_at desc);

alter table public.user_insights enable row level security;

drop policy if exists "user_insights_select_own" on public.user_insights;
create policy "user_insights_select_own"
  on public.user_insights
  for select
  using (user_id = public.current_user_id());

-- Insert/update only by trusted functions/service role

create or replace function public.ensure_user_insights_row(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_insights(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.ensure_user_insights_row(uuid) from public;
revoke all on function public.ensure_user_insights_row(uuid) from authenticated;

create or replace function public.recompute_user_insights(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_primary text[] := '{}'::text[];
  v_traits text[] := '{}'::text[];
  v_patterns text[] := '{}'::text[];
  v_trends jsonb := '{}'::jsonb;

  v_interest record;
  v_loc text;

  v_compat record;
  v_music int := 0;
  v_movies int := 0;
  v_books int := 0;
  v_travel int := 0;
  v_food int := 0;
  v_sports int := 0;
  v_gaming int := 0;
  v_tech int := 0;
  v_hobbies int := 0;
  v_cnt int := 0;

  v_low uuid;
  v_high uuid;
  v_other uuid;
  v_meta jsonb;
  v_common text[];

begin
  if p_user_id is null then
    return;
  end if;

  perform public.ensure_user_insights_row(p_user_id);

  -- Primary interests: prefer user_interests.common_interests if present
  select * into v_interest
  from public.user_interests
  where user_id = p_user_id;

  if v_interest is not null then
    if v_interest.common_interests is not null then
      v_primary := v_interest.common_interests;
    end if;

    -- Simple traits heuristic based on filled preferences
    if v_interest.travel_destination is not null or v_interest.travel_category is not null then
      v_traits := v_traits || array['Adventurous'];
    end if;
    if v_interest.hobby_interest is not null then
      v_traits := v_traits || array['Creative'];
    end if;
    if v_interest.tech_gadget is not null then
      v_traits := v_traits || array['Analytical'];
    end if;
    if v_interest.music_category is not null or v_interest.favorite_singer is not null then
      v_traits := v_traits || array['Expressive'];
    end if;
    if v_interest.sport is not null then
      v_patterns := v_patterns || array['Active lifestyle'];
    end if;
  end if;

  -- Lifestyle patterns: derive from profile basics (location presence implies social networking)
  select location into v_loc
  from public.profiles
  where id = p_user_id;

  if v_loc is not null and v_loc <> '' then
    v_patterns := v_patterns || array['Social networking'];
  end if;

  -- Compatibility trends: average common-interest categories across accepted matches
  for v_other in
    select other_user_id
    from public.my_matches
    where status = 'accepted'
    limit 50
  loop
    if p_user_id < v_other then
      v_low := p_user_id; v_high := v_other;
    else
      v_low := v_other; v_high := p_user_id;
    end if;

    select score_breakdown into v_compat
    from public.user_compatibility
    where user_low = v_low and user_high = v_high
    limit 1;

    -- Prefer match metadata common_interests if present (more semantically meaningful)
    select metadata into v_meta
    from public.matches
    where (user_low = v_low and user_high = v_high)
    limit 1;

    v_common := coalesce((v_meta->'common_interests')::text[], '{}'::text[]);

    -- Fallback if jsonb cast fails
    if v_common is null then
      v_common := '{}'::text[];
    end if;

    v_cnt := v_cnt + 1;

    if 'MusicCategory' = any(v_common) or 'Song' = any(v_common) or 'Singer' = any(v_common) then v_music := v_music + 1; end if;
    if 'Movie' = any(v_common) or 'MovieCategory' = any(v_common) or 'TVSeries' = any(v_common) then v_movies := v_movies + 1; end if;
    if 'Book' = any(v_common) or 'BookCategory' = any(v_common) then v_books := v_books + 1; end if;
    if 'TravelDestination' = any(v_common) or 'TravelCategory' = any(v_common) then v_travel := v_travel + 1; end if;
    if 'FoodCuisine' = any(v_common) or 'FoodCategory' = any(v_common) then v_food := v_food + 1; end if;
    if 'Sport' = any(v_common) or 'Athlete' = any(v_common) then v_sports := v_sports + 1; end if;
    if 'VideoGame' = any(v_common) then v_gaming := v_gaming + 1; end if;
    if 'TechGadget' = any(v_common) then v_tech := v_tech + 1; end if;
    if 'HobbyInterest' = any(v_common) then v_hobbies := v_hobbies + 1; end if;
  end loop;

  if v_cnt > 0 then
    v_trends := jsonb_build_object(
      'music', least(100, greatest(0, round((v_music::numeric / v_cnt::numeric) * 100)))::int,
      'movies', least(100, greatest(0, round((v_movies::numeric / v_cnt::numeric) * 100)))::int,
      'books', least(100, greatest(0, round((v_books::numeric / v_cnt::numeric) * 100)))::int,
      'travel', least(100, greatest(0, round((v_travel::numeric / v_cnt::numeric) * 100)))::int,
      'food', least(100, greatest(0, round((v_food::numeric / v_cnt::numeric) * 100)))::int,
      'sports', least(100, greatest(0, round((v_sports::numeric / v_cnt::numeric) * 100)))::int,
      'gaming', least(100, greatest(0, round((v_gaming::numeric / v_cnt::numeric) * 100)))::int,
      'technology', least(100, greatest(0, round((v_tech::numeric / v_cnt::numeric) * 100)))::int,
      'hobbies', least(100, greatest(0, round((v_hobbies::numeric / v_cnt::numeric) * 100)))::int
    );
  else
    v_trends := jsonb_build_object(
      'music', 0,
      'movies', 0,
      'books', 0,
      'travel', 0,
      'food', 0,
      'sports', 0,
      'gaming', 0,
      'technology', 0,
      'hobbies', 0
    );
  end if;

  -- Normalize arrays (distinct)
  v_traits := (select coalesce(array_agg(distinct x order by x), '{}'::text[]) from unnest(coalesce(v_traits, '{}'::text[])) t(x) where x is not null and x <> '');
  v_patterns := (select coalesce(array_agg(distinct x order by x), '{}'::text[]) from unnest(coalesce(v_patterns, '{}'::text[])) t(x) where x is not null and x <> '');

  update public.user_insights
  set primary_interests = coalesce(v_primary, '{}'::text[]),
      personality_traits = coalesce(v_traits, '{}'::text[]),
      lifestyle_patterns = coalesce(v_patterns, '{}'::text[]),
      compatibility_trends = coalesce(v_trends, '{}'::jsonb),
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.recompute_user_insights(uuid) from public;
revoke all on function public.recompute_user_insights(uuid) from authenticated;

-- Triggers to keep insights fresh
create or replace function public.trg_touch_user_insights()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_user_insights(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

-- When user updates interests
drop trigger if exists trg_user_interests_touch_insights_ins on public.user_interests;
create trigger trg_user_interests_touch_insights_ins
after insert on public.user_interests
for each row execute function public.trg_touch_user_insights();

drop trigger if exists trg_user_interests_touch_insights_upd on public.user_interests;
create trigger trg_user_interests_touch_insights_upd
after update on public.user_interests
for each row execute function public.trg_touch_user_insights();

-- When match status changes or created
create or replace function public.trg_touch_user_insights_from_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_user_insights(coalesce(new.user_low, old.user_low));
  perform public.recompute_user_insights(coalesce(new.user_high, old.user_high));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_matches_touch_insights_ins on public.matches;
create trigger trg_matches_touch_insights_ins
after insert on public.matches
for each row execute function public.trg_touch_user_insights_from_match();

drop trigger if exists trg_matches_touch_insights_upd on public.matches;
create trigger trg_matches_touch_insights_upd
after update of status on public.matches
for each row execute function public.trg_touch_user_insights_from_match();

-- When compatibility score updates
create or replace function public.trg_touch_user_insights_from_compat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_user_insights(coalesce(new.user_low, old.user_low));
  perform public.recompute_user_insights(coalesce(new.user_high, old.user_high));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_compat_touch_insights_ins on public.user_compatibility;
create trigger trg_compat_touch_insights_ins
after insert on public.user_compatibility
for each row execute function public.trg_touch_user_insights_from_compat();

drop trigger if exists trg_compat_touch_insights_upd on public.user_compatibility;
create trigger trg_compat_touch_insights_upd
after update on public.user_compatibility
for each row execute function public.trg_touch_user_insights_from_compat();

commit;
