begin;

-- Add/ensure ON DELETE CASCADE links from user-owned tables to auth.users.
-- Run this in Supabase SQL editor.
-- Note: If your existing FK constraint names differ, Supabase may error on the DROP.
-- In that case, run the companion inspection script (supabase_fk_inspect_user_tables.sql)
-- and update the constraint names accordingly.

-- 1) profiles: commonly profiles.id == auth.users.id
alter table if exists public.profiles
  drop constraint if exists profiles_id_fkey;

alter table if exists public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

-- 2) user_interests
alter table if exists public.user_interests
  drop constraint if exists user_interests_user_id_fkey;

alter table if exists public.user_interests
  add constraint user_interests_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 3) user_preferences
alter table if exists public.user_preferences
  drop constraint if exists user_preferences_user_id_fkey;

alter table if exists public.user_preferences
  add constraint user_preferences_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 4) user_photos
alter table if exists public.user_photos
  drop constraint if exists user_photos_user_id_fkey;

alter table if exists public.user_photos
  add constraint user_photos_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

commit;
