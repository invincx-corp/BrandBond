-- Auto-create notifications when a message is created
-- Inserts a notification for the receiver with entity_type='conversation' and entity_id=messages.conversation_id
-- Notes:
-- - Uses notifications.type = 'message'
-- - Only fires for message_type = 'text' by default (adjust if you want for other types)

begin;

create or replace function public.notify_message_created()
returns trigger
language plpgsql
as $$
declare
  v_preview text;
begin
  -- Only fire on insert
  if (tg_op <> 'INSERT') then
    return new;
  end if;

  -- Optional: ignore non-text messages (tweak as needed)
  if new.type is distinct from 'text' then
    return new;
  end if;

  -- Preview (avoid very long titles/messages)
  v_preview := coalesce(nullif(trim(new.text), ''), 'New message');
  if length(v_preview) > 120 then
    v_preview := left(v_preview, 117) || '...';
  end if;

  insert into public.notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    new.receiver_id,
    'message',
    'New Message',
    v_preview,
    'conversation',
    new.conversation_id
  );

  return new;
end;
$$;

alter function public.notify_message_created() security definer;

revoke all on function public.notify_message_created() from public;
grant execute on function public.notify_message_created() to authenticated;

drop trigger if exists trg_notify_message_created on public.messages;
create trigger trg_notify_message_created
after insert on public.messages
for each row
execute function public.notify_message_created();

commit;
