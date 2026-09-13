-- A user's very first plan has nothing to compete with, so make it active
-- automatically instead of leaving them to find "Set as active" on their
-- only plan. Piggybacks on the existing BEFORE INSERT trigger that already
-- assigns order_index, rather than adding a second trigger.
create or replace function public.assign_next_plan_order_index()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_index is null or new.order_index = -1 then
    select coalesce(min(order_index), 0) - 1 into new.order_index
    from public.workout_plans
    where user_id = new.user_id;
  end if;

  if not exists (select 1 from public.workout_plans where user_id = new.user_id) then
    new.is_active := true;
  end if;

  return new;
end;
$$;
