-- Match metadata computation + refresh

-- This file adds server-generated match metadata:
-- - metadata.match_percentage (0..1)
-- - metadata.common_interests (text[])

-- Helper: normalize a text value
create or replace function public._bb_norm(p_txt text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(p_txt)), '');
$$;

-- Helper: unique array concat for text[]
create or replace function public._bb_array_union(a text[], b text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    (select array_agg(distinct x order by x)
     from unnest(coalesce(a, '{}'::text[]) || coalesce(b, '{}'::text[])) as t(x)
     where x is not null and x <> ''),
    '{}'::text[]
  );
$$;

-- Compute common interests for two users based on user_interests columns.
-- Returns:
--  { common_interests: text[], match_percentage: float8 }
create or replace function public.compute_match_metadata(
  p_user_low uuid,
  p_user_high uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  b record;

  common text[] := '{}'::text[];
  overlap_count int := 0;
  total_considered int := 0;

  match_pct float8;
  inter text[];
begin
  select * into a from public.user_interests where user_id = p_user_low;
  select * into b from public.user_interests where user_id = p_user_high;

  -- If either user has no interests row yet, return empty metadata.
  if a is null or b is null then
    return jsonb_build_object(
      'match_percentage', 0::float8,
      'common_interests', '{}'::text[]
    );
  end if;

  -- Single-value overlaps (primary favorites)
  total_considered := total_considered + 1;
  if public._bb_norm(a.music_category) is not null and public._bb_norm(a.music_category) = public._bb_norm(b.music_category) then
    common := public._bb_array_union(common, array['MusicCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.favorite_song) is not null and public._bb_norm(a.favorite_song) = public._bb_norm(b.favorite_song) then
    common := public._bb_array_union(common, array['Song']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.favorite_singer) is not null and public._bb_norm(a.favorite_singer) = public._bb_norm(b.favorite_singer) then
    common := public._bb_array_union(common, array['Singer']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.favorite_movie) is not null and public._bb_norm(a.favorite_movie) = public._bb_norm(b.favorite_movie) then
    common := public._bb_array_union(common, array['Movie']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.movie_category) is not null and public._bb_norm(a.movie_category) = public._bb_norm(b.movie_category) then
    common := public._bb_array_union(common, array['MovieCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.tv_series) is not null and public._bb_norm(a.tv_series) = public._bb_norm(b.tv_series) then
    common := public._bb_array_union(common, array['TVSeries']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.tv_series_category) is not null and public._bb_norm(a.tv_series_category) = public._bb_norm(b.tv_series_category) then
    common := public._bb_array_union(common, array['TVSeriesCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.favorite_book) is not null and public._bb_norm(a.favorite_book) = public._bb_norm(b.favorite_book) then
    common := public._bb_array_union(common, array['Book']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.book_category) is not null and public._bb_norm(a.book_category) = public._bb_norm(b.book_category) then
    common := public._bb_array_union(common, array['BookCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.cartoon) is not null and public._bb_norm(a.cartoon) = public._bb_norm(b.cartoon) then
    common := public._bb_array_union(common, array['Cartoon']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.travel_destination) is not null and public._bb_norm(a.travel_destination) = public._bb_norm(b.travel_destination) then
    common := public._bb_array_union(common, array['TravelDestination']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.travel_category) is not null and public._bb_norm(a.travel_category) = public._bb_norm(b.travel_category) then
    common := public._bb_array_union(common, array['TravelCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.food_cuisine) is not null and public._bb_norm(a.food_cuisine) = public._bb_norm(b.food_cuisine) then
    common := public._bb_array_union(common, array['FoodCuisine']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.food_category) is not null and public._bb_norm(a.food_category) = public._bb_norm(b.food_category) then
    common := public._bb_array_union(common, array['FoodCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.sport) is not null and public._bb_norm(a.sport) = public._bb_norm(b.sport) then
    common := public._bb_array_union(common, array['Sport']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.athlete) is not null and public._bb_norm(a.athlete) = public._bb_norm(b.athlete) then
    common := public._bb_array_union(common, array['Athlete']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.video_game) is not null and public._bb_norm(a.video_game) = public._bb_norm(b.video_game) then
    common := public._bb_array_union(common, array['VideoGame']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.tech_gadget) is not null and public._bb_norm(a.tech_gadget) = public._bb_norm(b.tech_gadget) then
    common := public._bb_array_union(common, array['TechGadget']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.shopping_brand) is not null and public._bb_norm(a.shopping_brand) = public._bb_norm(b.shopping_brand) then
    common := public._bb_array_union(common, array['ShoppingBrand']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.hobby_interest) is not null and public._bb_norm(a.hobby_interest) = public._bb_norm(b.hobby_interest) then
    common := public._bb_array_union(common, array['HobbyInterest']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  if public._bb_norm(a.habit) is not null and public._bb_norm(a.habit) = public._bb_norm(b.habit) then
    common := public._bb_array_union(common, array['Habit']);
    overlap_count := overlap_count + 1;
  end if;

  -- Array overlaps (additional favorites)
  -- Note: these columns are arrays per registrationService usage.

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_music_category, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_music_category, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['MusicCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_song, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_song, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Song']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_singer, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_singer, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Singer']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_movie, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_movie, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Movie']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_movie_category, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_movie_category, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['MovieCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_tv_series, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_tv_series, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['TVSeries']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_tv_series_category, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_tv_series_category, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['TVSeriesCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_book, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_book, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Book']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_book_category, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_book_category, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['BookCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_cartoon, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_cartoon, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Cartoon']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_travel_destination, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_travel_destination, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['TravelDestination']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_travel_category, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_travel_category, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['TravelCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_food_cuisine, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_food_cuisine, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['FoodCuisine']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_food_category, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_food_category, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['FoodCategory']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_sport, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_sport, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Sport']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_athlete, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_athlete, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['Athlete']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_video_game, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_video_game, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['VideoGame']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_tech_gadget, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_tech_gadget, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['TechGadget']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_shopping_brand, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_shopping_brand, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['ShoppingBrand']);
    overlap_count := overlap_count + 1;
  end if;

  total_considered := total_considered + 1;
  inter := (
    select coalesce(array_agg(distinct x order by x), '{}'::text[])
    from (
      select unnest(coalesce(a.additional_hobby_interest, '{}'::text[])) as x
      intersect
      select unnest(coalesce(b.additional_hobby_interest, '{}'::text[])) as x
    ) s
    where x is not null and x <> ''
  );
  if array_length(inter, 1) is not null and array_length(inter, 1) > 0 then
    common := public._bb_array_union(common, array['HobbyInterest']);
    overlap_count := overlap_count + 1;
  end if;

  -- Convert overlaps to percentage.
  -- + baseline so it's never flat zero if there is any data.
  if total_considered <= 0 then
    match_pct := 0;
  else
    match_pct := least(1::float8, greatest(0::float8, (0.2::float8 + (overlap_count::float8 / total_considered::float8) * 0.8::float8)));
  end if;

  return jsonb_build_object(
    'match_percentage', match_pct,
    'common_interests', common
  );
end;
$$;

revoke all on function public.compute_match_metadata(uuid, uuid) from public;
revoke all on function public.compute_match_metadata(uuid, uuid) from anon;
revoke all on function public.compute_match_metadata(uuid, uuid) from authenticated;

-- Refresh (write) match metadata for one match row.
create or replace function public.refresh_match_metadata(p_match_id uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.matches;
  meta jsonb;
begin
  select * into m from public.matches where id = p_match_id;
  if m is null then
    raise exception 'match not found';
  end if;

  meta := public.compute_match_metadata(m.user_low, m.user_high);

  update public.matches
  set metadata = coalesce(public.matches.metadata, '{}'::jsonb) || coalesce(meta, '{}'::jsonb)
  where id = p_match_id
  returning * into m;

  return m;
end;
$$;

-- Only service role should execute write RPC
revoke all on function public.refresh_match_metadata(uuid) from public;
revoke all on function public.refresh_match_metadata(uuid) from anon;
revoke all on function public.refresh_match_metadata(uuid) from authenticated;

-- Trigger: refresh metadata when a match is inserted/accepted
create or replace function public.trg_refresh_match_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- On insert, compute immediately (even if pending) to keep UI consistent.
  -- On update, compute when status becomes accepted.
  if tg_op = 'INSERT' then
    perform public.refresh_match_metadata(new.id);
  elsif tg_op = 'UPDATE' then
    if new.status = 'accepted' and (old.status is distinct from 'accepted') then
      perform public.refresh_match_metadata(new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_matches_refresh_metadata_ins on public.matches;
create trigger trg_matches_refresh_metadata_ins
after insert on public.matches
for each row execute function public.trg_refresh_match_metadata();

drop trigger if exists trg_matches_refresh_metadata_upd on public.matches;
create trigger trg_matches_refresh_metadata_upd
after update of status on public.matches
for each row execute function public.trg_refresh_match_metadata();
