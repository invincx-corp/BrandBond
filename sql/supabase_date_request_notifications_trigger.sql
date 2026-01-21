-- Auto-create notifications when a date request is created
-- Inserts a notification for the receiver with entity_type='date_request' and entity_id=date_requests.id

begin;

create or replace function public.notify_date_request_created()
returns trigger
language plpgsql
as $$
begin
  -- Only fire on insert
  insert into public.notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    new.to_user_id,
    'date_request',
    'New Date Request',
    coalesce(new.message, 'You have a new date request.'),
    'date_request',
    new.id
  );

  return new;
end;
$$;

alter function public.notify_date_request_created() security definer;

revoke all on function public.notify_date_request_created() from public;
grant execute on function public.notify_date_request_created() to authenticated;

drop trigger if exists trg_notify_date_request_created on public.date_requests;
create trigger trg_notify_date_request_created
after insert on public.date_requests
for each row
execute function public.notify_date_request_created();

commit;
