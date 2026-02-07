begin;

-- =========================================================
-- BrandBond: Social posts (Friends dashboard feed)
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text null,
  media_url text not null,
  media_type text not null default 'image',
  created_at timestamptz not null default now()
);

create index if not exists idx_social_posts_created_at
  on public.social_posts (created_at desc);

create index if not exists idx_social_posts_user_id
  on public.social_posts (user_id);

alter table public.social_posts enable row level security;

drop policy if exists "social_posts_select_all" on public.social_posts;
create policy "social_posts_select_all"
on public.social_posts
for select
using (true);

drop policy if exists "social_posts_insert_own" on public.social_posts;
create policy "social_posts_insert_own"
on public.social_posts
for insert
with check (user_id = auth.uid());

drop policy if exists "social_posts_delete_own" on public.social_posts;
create policy "social_posts_delete_own"
on public.social_posts
for delete
using (user_id = auth.uid());

commit;
