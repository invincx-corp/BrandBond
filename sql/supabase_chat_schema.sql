begin;

-- =========================================================
-- BrandBond: Chat schema (conversations + messages) for Supabase
-- =========================================================

create extension if not exists pgcrypto;

-- --------------- Enum types ---------------

do $$ begin
  create type public.conversation_universe as enum ('love', 'friends', 'both');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_type as enum (
    'text',
    'image',
    'voice',
    'location',
    'date-invite',
    'ai-enhanced',
    'story-reply',
    'gif',
    'file',
    'poll',
    'voice-note'
  );
exception
  when duplicate_object then null;
end $$;

-- =========================================================
-- Conversations
-- One row per pair (direct 1:1). Canonical ordering to enforce uniqueness.
-- =========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  universe public.conversation_universe not null default 'both',
  is_archived boolean not null default false,
  is_blocked boolean not null default false,
  is_pinned_by_low boolean not null default false,
  is_pinned_by_high boolean not null default false,
  is_muted_by_low boolean not null default false,
  is_muted_by_high boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_conversation_user_order check (user_low < user_high),
  constraint chk_conversation_users_distinct check (user_low <> user_high)
);

create unique index if not exists ux_conversations_pair
  on public.conversations (user_low, user_high);

create index if not exists idx_conversations_updated_at
  on public.conversations (updated_at desc);

create index if not exists idx_conversations_user_low
  on public.conversations (user_low);

create index if not exists idx_conversations_user_high
  on public.conversations (user_high);

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
on public.conversations
for select
using (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

drop policy if exists "conversations_insert_participants" on public.conversations;
create policy "conversations_insert_participants"
on public.conversations
for insert
with check (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

drop policy if exists "conversations_update_participants" on public.conversations;
create policy "conversations_update_participants"
on public.conversations
for update
using (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
)
with check (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

drop policy if exists "conversations_delete_participants" on public.conversations;
create policy "conversations_delete_participants"
on public.conversations
for delete
using (
  user_low = public.current_user_id()
  or user_high = public.current_user_id()
);

-- =========================================================
-- Messages
-- =========================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  type public.message_type not null default 'text',
  text text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz null,
  deleted_at timestamptz null
);

create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at asc);

create index if not exists idx_messages_receiver_created
  on public.messages (receiver_id, created_at desc);

create index if not exists idx_messages_sender_created
  on public.messages (sender_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
using (
  sender_id = public.current_user_id()
  or receiver_id = public.current_user_id()
);

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
on public.messages
for insert
with check (sender_id = public.current_user_id());

drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender"
on public.messages
for update
using (sender_id = public.current_user_id())
with check (sender_id = public.current_user_id());

-- Allow receiver to mark read via receipts table, not by mutating message rows.

drop policy if exists "messages_delete_sender" on public.messages;
create policy "messages_delete_sender"
on public.messages
for delete
using (sender_id = public.current_user_id());

-- =========================================================
-- Read receipts
-- =========================================================
create table if not exists public.message_read_receipts (
  message_id uuid primary key references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reader_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now()
);

create index if not exists idx_message_receipts_conversation_reader
  on public.message_read_receipts (conversation_id, reader_id);

alter table public.message_read_receipts enable row level security;

drop policy if exists "message_receipts_select_participants" on public.message_read_receipts;
create policy "message_receipts_select_participants"
on public.message_read_receipts
for select
using (reader_id = public.current_user_id());

drop policy if exists "message_receipts_insert_reader" on public.message_read_receipts;
create policy "message_receipts_insert_reader"
on public.message_read_receipts
for insert
with check (reader_id = public.current_user_id());

drop policy if exists "message_receipts_delete_reader" on public.message_read_receipts;
create policy "message_receipts_delete_reader"
on public.message_read_receipts
for delete
using (reader_id = public.current_user_id());

-- =========================================================
-- Message reactions
-- =========================================================
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint ux_message_reactions_unique unique (message_id, user_id)
);

create index if not exists idx_message_reactions_message
  on public.message_reactions (message_id, created_at desc);

create index if not exists idx_message_reactions_user
  on public.message_reactions (user_id, created_at desc);

alter table public.message_reactions enable row level security;

drop policy if exists "message_reactions_select_participants" on public.message_reactions;
create policy "message_reactions_select_participants"
on public.message_reactions
for select
using (
  exists (
    select 1
    from public.messages m
    where m.id = message_id
      and (m.sender_id = public.current_user_id() or m.receiver_id = public.current_user_id())
  )
);

drop policy if exists "message_reactions_insert_self" on public.message_reactions;
create policy "message_reactions_insert_self"
on public.message_reactions
for insert
with check (
  user_id = public.current_user_id()
  and exists (
    select 1
    from public.messages m
    where m.id = message_id
      and (m.sender_id = public.current_user_id() or m.receiver_id = public.current_user_id())
  )
);

drop policy if exists "message_reactions_update_self" on public.message_reactions;
create policy "message_reactions_update_self"
on public.message_reactions
for update
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

drop policy if exists "message_reactions_delete_self" on public.message_reactions;
create policy "message_reactions_delete_self"
on public.message_reactions
for delete
using (user_id = public.current_user_id());

-- =========================================================
-- Polls (stored on top of messages table via message_type = 'poll')
-- =========================================================
create table if not exists public.polls (
  message_id uuid primary key references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  question text not null,
  options text[] not null,
  created_at timestamptz not null default now(),
  constraint chk_poll_options_min check (array_length(options, 1) >= 2)
);

create index if not exists idx_polls_conversation_created
  on public.polls (conversation_id, created_at desc);

alter table public.polls enable row level security;

drop policy if exists "polls_select_participants" on public.polls;
create policy "polls_select_participants"
on public.polls
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
);

drop policy if exists "polls_insert_participants" on public.polls;
create policy "polls_insert_participants"
on public.polls
for insert
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
);

drop policy if exists "polls_update_participants" on public.polls;
create policy "polls_update_participants"
on public.polls
for update
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
);

drop policy if exists "polls_delete_participants" on public.polls;
create policy "polls_delete_participants"
on public.polls
for delete
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
);

-- =========================================================
-- Poll votes
-- One vote per user per poll message
-- =========================================================
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  option_index int not null,
  created_at timestamptz not null default now(),
  constraint ux_poll_votes_unique unique (message_id, voter_id)
);

create index if not exists idx_poll_votes_message
  on public.poll_votes (message_id, created_at desc);

create index if not exists idx_poll_votes_voter
  on public.poll_votes (voter_id, created_at desc);

alter table public.poll_votes enable row level security;

drop policy if exists "poll_votes_select_participants" on public.poll_votes;
create policy "poll_votes_select_participants"
on public.poll_votes
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
);

drop policy if exists "poll_votes_insert_self" on public.poll_votes;
create policy "poll_votes_insert_self"
on public.poll_votes
for insert
with check (
  voter_id = public.current_user_id()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.user_low = public.current_user_id() or c.user_high = public.current_user_id())
  )
);

drop policy if exists "poll_votes_update_self" on public.poll_votes;
create policy "poll_votes_update_self"
on public.poll_votes
for update
using (voter_id = public.current_user_id())
with check (voter_id = public.current_user_id());

drop policy if exists "poll_votes_delete_self" on public.poll_votes;
create policy "poll_votes_delete_self"
on public.poll_votes
for delete
using (voter_id = public.current_user_id());

-- =========================================================
-- Utility: canonical conversation id lookup/create for direct messages
-- =========================================================
create or replace function public.get_or_create_conversation(p_other_user uuid, p_universe public.conversation_universe default 'both')
returns uuid
language plpgsql
security definer
as $$
declare
  v_low uuid;
  v_high uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_other_user is null then
    raise exception 'Other user is required';
  end if;

  if auth.uid() = p_other_user then
    raise exception 'Cannot create conversation with self';
  end if;

  if auth.uid() < p_other_user then
    v_low := auth.uid();
    v_high := p_other_user;
  else
    v_low := p_other_user;
    v_high := auth.uid();
  end if;

  select id into v_id
  from public.conversations
  where user_low = v_low and user_high = v_high
  limit 1;

  if v_id is null then
    insert into public.conversations (user_low, user_high, universe)
    values (v_low, v_high, p_universe)
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

-- =========================================================
-- Trigger: bump conversation.updated_at on message insert
-- =========================================================
create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_updated_at on public.messages;
create trigger trg_touch_conversation_updated_at
after insert on public.messages
for each row
execute function public.touch_conversation_updated_at();

commit;
