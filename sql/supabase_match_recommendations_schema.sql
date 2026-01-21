begin;

create extension if not exists pgcrypto;

-- Realtime-ready recommendation feed for Romantic Matches (discover / suggested profiles).
-- One row per (user_id, recommended_user_id), refreshed by server-side jobs/edge functions.
create table if not exists public.match_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommended_user_id uuid not null references auth.users(id) on delete cascade,

  score integer not null default 0,
  reasons jsonb not null default '{}'::jsonb,

  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz null,

  constraint ux_match_reco unique (user_id, recommended_user_id),
  constraint chk_reco_score_range check (score >= 0 and score <= 100)
);

create index if not exists idx_match_reco_user_created
  on public.match_recommendations (user_id, created_at desc);

alter table public.match_recommendations enable row level security;

-- Users can only read their own recommendations.
drop policy if exists "match_recommendations_select_own" on public.match_recommendations;
create policy "match_recommendations_select_own"
  on public.match_recommendations
  for select
  using (user_id = public.current_user_id());

-- Inserts/updates should be done by trusted jobs/service role.
-- No public insert/update policies.

create or replace function public.touch_match_recommendations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_match_recommendations_updated_at on public.match_recommendations;
create trigger trg_touch_match_recommendations_updated_at
before update on public.match_recommendations
for each row
execute function public.touch_match_recommendations_updated_at();

commit;
