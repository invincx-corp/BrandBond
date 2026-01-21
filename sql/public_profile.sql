create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  full_name text,
  date_of_birth date,
  age int,
  gender text,
  location text,
  intent text check (intent in ('dating', 'friends', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;