begin;

-- =========================================================
-- BrandBond: Compatibility writer utilities
-- This provides a service-role callable function to upsert compatibility rows.
-- Clients can still only SELECT (per supabase_compatibility_schema.sql policies).
-- =========================================================

create extension if not exists pgcrypto;

-- Upsert compatibility score for a pair.
-- SECURITY DEFINER so it can be invoked by trusted server (service role),
-- while regular clients should NOT be granted execute.
create or replace function public.upsert_user_compatibility(
  p_user_low uuid,
  p_user_high uuid,
  p_score integer,
  p_score_breakdown jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  if p_user_low is null or p_user_high is null then
    raise exception 'Both users are required';
  end if;

  if p_user_low = p_user_high then
    raise exception 'Users must be distinct';
  end if;

  if p_user_low > p_user_high then
    raise exception 'User order invalid: user_low must be < user_high';
  end if;

  if p_score < 0 or p_score > 100 then
    raise exception 'Score must be between 0 and 100';
  end if;

  insert into public.user_compatibility (user_low, user_high, score, score_breakdown, updated_at)
  values (p_user_low, p_user_high, p_score, coalesce(p_score_breakdown, '{}'::jsonb), now())
  on conflict (user_low, user_high)
  do update set
    score = excluded.score,
    score_breakdown = excluded.score_breakdown,
    updated_at = now();
end;
$$;

-- Do NOT grant to authenticated users. Only service role should use it.
revoke all on function public.upsert_user_compatibility(uuid,uuid,integer,jsonb) from public;
revoke all on function public.upsert_user_compatibility(uuid,uuid,integer,jsonb) from authenticated;

commit;
