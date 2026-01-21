begin;

-- Add explicit last_message_at for "conversationsActive" calculations
alter table public.conversations
  add column if not exists last_message_at timestamptz null;

-- Backfill from existing messages
update public.conversations c
set last_message_at = m.max_created_at
from (
  select conversation_id, max(created_at) as max_created_at
  from public.messages
  group by conversation_id
) m
where c.id = m.conversation_id
  and (c.last_message_at is null or c.last_message_at <> m.max_created_at);

create index if not exists idx_conversations_last_message_at
  on public.conversations (last_message_at desc);

-- Keep last_message_at (and updated_at) in sync on every new message
create or replace function public.touch_conversation_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_updated_at on public.messages;
drop trigger if exists trg_touch_conversation_last_message_at on public.messages;

create trigger trg_touch_conversation_last_message_at
after insert on public.messages
for each row
execute function public.touch_conversation_last_message_at();

commit;
