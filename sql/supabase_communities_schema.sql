begin;

create extension if not exists pgcrypto;

create table if not exists public.user_communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default 'General',
  is_public boolean not null default true,
  member_count integer not null default 0,
  icon_url text null,
  cover_image_url text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_communities_public
  on public.user_communities (is_public, member_count desc);

alter table public.user_communities enable row level security;

-- Anyone authenticated can read public communities
drop policy if exists "user_communities_select_public" on public.user_communities;
create policy "user_communities_select_public"
  on public.user_communities
  for select
  using (is_public = true);

-- Create community_members join table
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.user_communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  constraint ux_community_member unique (community_id, user_id)
);

create index if not exists idx_community_members_user
  on public.community_members (user_id, created_at desc);

create index if not exists idx_community_members_community
  on public.community_members (community_id, created_at desc);

alter table public.community_members enable row level security;

-- Members can see their memberships; for UI we also allow reading memberships for public communities.
drop policy if exists "community_members_select_own" on public.community_members;
create policy "community_members_select_own"
  on public.community_members
  for select
  using (
    user_id = public.current_user_id()
    or exists (
      select 1
      from public.user_communities c
      where c.id = community_id and c.is_public = true
    )
  );

-- Users can join a public community (insert self)
drop policy if exists "community_members_insert_self" on public.community_members;
create policy "community_members_insert_self"
  on public.community_members
  for insert
  with check (
    user_id = public.current_user_id()
    and exists (
      select 1
      from public.user_communities c
      where c.id = community_id and c.is_public = true
    )
  );

-- Users can leave (delete self)
drop policy if exists "community_members_delete_self" on public.community_members;
create policy "community_members_delete_self"
  on public.community_members
  for delete
  using (user_id = public.current_user_id());

-- Keep member_count in sync
create or replace function public.recompute_community_member_count(p_community_id uuid)
returns void
language plpgsql
as $$
declare
  v_count integer;
begin
  if p_community_id is null then
    return;
  end if;

  select count(*) into v_count
  from public.community_members
  where community_id = p_community_id;

  update public.user_communities
  set member_count = coalesce(v_count, 0),
      updated_at = now()
  where id = p_community_id;
end;
$$;

create or replace function public.trg_touch_community_member_count()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_community_member_count(coalesce(new.community_id, old.community_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_community_members_touch_count_ins on public.community_members;
create trigger trg_community_members_touch_count_ins
after insert on public.community_members
for each row execute function public.trg_touch_community_member_count();

drop trigger if exists trg_community_members_touch_count_del on public.community_members;
create trigger trg_community_members_touch_count_del
after delete on public.community_members
for each row execute function public.trg_touch_community_member_count();

commit;
