-- workout_plans was originally backfilled newest-first (order_index 0 for
-- the most recently created plan — see 20260812111728), but the insert
-- trigger assigned new rows max(order_index)+1, appending them to the end
-- instead. Assign min(order_index)-1 instead, so a newly created plan
-- always sorts first, matching that original intent.
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
  return new;
end;
$$;
