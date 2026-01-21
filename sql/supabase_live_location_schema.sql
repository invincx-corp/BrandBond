-- Live location sharing for 1:1 conversations

-- UUID generator (pick ONE; uuid-ossp is common in Supabase)
create extension if not exists "uuid-ossp";

create table if not exists location_shares (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sharer_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','stopped','expired')),
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null
);

create index if not exists idx_location_shares_conversation on location_shares(conversation_id);
create index if not exists idx_location_shares_viewer on location_shares(viewer_id);
create index if not exists idx_location_shares_sharer on location_shares(sharer_id);

create table if not exists user_locations (
  id uuid primary key default uuid_generate_v4(),
  share_id uuid not null references location_shares(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  heading double precision,
  speed double precision,
  updated_at timestamp with time zone not null default now(),
  unique (share_id, user_id)
);

create index if not exists idx_user_locations_share on user_locations(share_id);

alter table location_shares enable row level security;
alter table user_locations enable row level security;

-- Recreate policies safely (Supabase doesn't support CREATE POLICY IF NOT EXISTS)
drop policy if exists "location_shares_insert_participant" on location_shares;
drop policy if exists "location_shares_select_participants" on location_shares;
drop policy if exists "location_shares_update_sharer" on location_shares;

drop policy if exists "user_locations_upsert_sharer_active" on user_locations;
drop policy if exists "user_locations_update_sharer_active" on user_locations;
drop policy if exists "user_locations_select_participants_active" on user_locations;

-- A user can create a share only if they are a participant in the conversation.
create policy "location_shares_insert_participant"
on location_shares
for insert
with check (
  auth.uid() = sharer_id
  and exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.user_low = auth.uid() or c.user_high = auth.uid())
      and (c.user_low = viewer_id or c.user_high = viewer_id)
  )
);

-- Participants (sharer/viewer) can see the share (needed for map + validation)
create policy "location_shares_select_participants"
on location_shares
for select
using (auth.uid() = sharer_id or auth.uid() = viewer_id);

-- Sharer can stop their share
create policy "location_shares_update_sharer"
on location_shares
for update
using (auth.uid() = sharer_id)
with check (auth.uid() = sharer_id);

-- Upsert location only by the sharer, only while share is active and not expired.
create policy "user_locations_upsert_sharer_active"
on user_locations
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from location_shares s
    where s.id = share_id
      and s.sharer_id = auth.uid()
      and s.status = 'active'
      and s.expires_at > now()
  )
);

create policy "user_locations_update_sharer_active"
on user_locations
for update
using (
  auth.uid() = user_id
  and exists (
    select 1 from location_shares s
    where s.id = share_id
      and s.sharer_id = auth.uid()
      and s.status = 'active'
      and s.expires_at > now()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from location_shares s
    where s.id = share_id
      and s.sharer_id = auth.uid()
      and s.status = 'active'
      and s.expires_at > now()
  )
);

-- Viewer and sharer can read location updates for active, unexpired shares.
create policy "user_locations_select_participants_active"
on user_locations
for select
using (
  exists (
    select 1 from location_shares s
    where s.id = share_id
      and (s.sharer_id = auth.uid() or s.viewer_id = auth.uid())
      and s.status = 'active'
      and s.expires_at > now()
  )
);