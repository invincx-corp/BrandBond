-- Auto-create notifications when a match becomes accepted
-- Inserts notifications for BOTH participants with entity_type='match' and entity_id=matches.id

begin;

create or replace function public.notify_match_accepted()
returns trigger
language plpgsql
as $$
begin
  -- Only fire when status transitions to accepted
  if (tg_op = 'UPDATE') and (new.status = 'accepted') and (old.status is distinct from 'accepted') then
    insert into public.notifications (user_id, type, title, message, entity_type, entity_id)
    values
      (new.user_low, 'new_match', 'New Match!', 'You have a new mutual match.', 'match', new.id),
      (new.user_high, 'new_match', 'New Match!', 'You have a new mutual match.', 'match', new.id);
  end if;

  return new;
end;
$$;

 alter function public.notify_match_accepted() security definer;

 revoke all on function public.notify_match_accepted() from public;
 grant execute on function public.notify_match_accepted() to authenticated;

drop trigger if exists trg_notify_match_accepted on public.matches;
create trigger trg_notify_match_accepted
after update of status on public.matches
for each row
execute function public.notify_match_accepted();

commit;
