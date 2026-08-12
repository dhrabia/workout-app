-- Drag-and-drop can move a day more than one position per gesture, so the
-- pairwise swap RPC no longer covers reordering days within a plan.
drop function if exists public.swap_plan_day_order(uuid, uuid);

-- Bulk-reassigns order_index for every day in a plan from a single
-- client-supplied ordering. Same two-pass sentinel trick as
-- reorder_plan_exercises, so the UNIQUE(plan_id, order_index) constraint is
-- never transiently violated mid-statement.
create or replace function public.reorder_plan_days(
  p_plan_id uuid,
  p_day_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  given_count integer;
  existing_count integer;
begin
  select count(*) into given_count
  from public.workout_plan_days
  where plan_id = p_plan_id and id = any(p_day_ids);

  select count(*) into existing_count
  from public.workout_plan_days
  where plan_id = p_plan_id;

  if given_count <> coalesce(array_length(p_day_ids, 1), 0)
     or given_count <> existing_count then
    raise exception 'p_day_ids must exactly match all days in plan %', p_plan_id;
  end if;

  update public.workout_plan_days as wpd
  set order_index = -(t.idx)
  from unnest(p_day_ids) with ordinality as t(id, idx)
  where wpd.id = t.id;

  update public.workout_plan_days as wpd
  set order_index = t.idx - 1
  from unnest(p_day_ids) with ordinality as t(id, idx)
  where wpd.id = t.id;
end;
$$;

revoke all on function public.reorder_plan_days(uuid, uuid[]) from public;
grant execute on function public.reorder_plan_days(uuid, uuid[]) to authenticated;
