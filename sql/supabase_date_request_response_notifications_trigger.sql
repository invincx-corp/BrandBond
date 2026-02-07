-- Auto-create notifications when a date request is responded to (accepted/declined/cancelled)
-- Inserts a notification for the sender (from_user_id) when receiver updates status.
-- entity_type='date_request' and entity_id=date_requests.id

begin;

create or replace function public.notify_date_request_responded()
returns trigger
language plpgsql
as $$
declare
  v_type public.notification_type;
  v_title text;
  v_message text;
begin
  -- Only fire on status change
  if (tg_op <> 'UPDATE') then
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  -- We notify only when leaving 'pending'
  if old.status <> 'pending' then
    return new;
  end if;

  if new.status = 'accepted' then
    v_type := 'date_accepted';
    v_title := 'Date Request Accepted';
    v_message := 'Your date request was accepted.';
  elsif new.status = 'declined' then
    -- Keep in the existing enum; choose 'system' to avoid expanding notification_type.
    v_type := 'system';
    v_title := 'Date Request Declined';
    v_message := 'Your date request was declined.';
  elsif new.status = 'cancelled' then
    v_type := 'system';
    v_title := 'Date Request Cancelled';
    v_message := 'The date request was cancelled.';
  else
    return new;
  end if;

  insert into public.notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    new.from_user_id,
    v_type,
    v_title,
    v_message,
    'date_request',
    new.id
  );

  return new;
end;
$$;

alter function public.notify_date_request_responded() security definer;

revoke all on function public.notify_date_request_responded() from public;
grant execute on function public.notify_date_request_responded() to authenticated;

drop trigger if exists trg_notify_date_request_responded on public.date_requests;
create trigger trg_notify_date_request_responded
after update of status on public.date_requests
for each row
execute function public.notify_date_request_responded();

commit;
