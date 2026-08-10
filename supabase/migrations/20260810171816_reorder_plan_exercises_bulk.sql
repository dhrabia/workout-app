-- Drag-and-drop can move an item more than one position per gesture, so the
-- pairwise swap RPC no longer covers reordering exercises within a day.
drop function if exists public.swap_plan_exercise_order(uuid, uuid);

-- Bulk-reassigns order_index for every exercise in a plan day from a single
-- client-supplied ordering. Two passes (negative sentinel, then final index)
-- so the UNIQUE(plan_day_id, order_index) constraint is never transiently
-- violated mid-statement, without having to make that constraint deferrable.
create or replace function public.reorder_plan_exercises(
  p_plan_day_id uuid,
  p_exercise_ids uuid[]
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
  from public.workout_plan_exercises
  where plan_day_id = p_plan_day_id and id = any(p_exercise_ids);

  select count(*) into existing_count
  from public.workout_plan_exercises
  where plan_day_id = p_plan_day_id;

  if given_count <> coalesce(array_length(p_exercise_ids, 1), 0)
     or given_count <> existing_count then
    raise exception 'p_exercise_ids must exactly match all exercises in plan day %', p_plan_day_id;
  end if;

  update public.workout_plan_exercises as wpe
  set order_index = -(t.idx)
  from unnest(p_exercise_ids) with ordinality as t(id, idx)
  where wpe.id = t.id;

  update public.workout_plan_exercises as wpe
  set order_index = t.idx - 1
  from unnest(p_exercise_ids) with ordinality as t(id, idx)
  where wpe.id = t.id;
end;
$$;

revoke all on function public.reorder_plan_exercises(uuid, uuid[]) from public;
grant execute on function public.reorder_plan_exercises(uuid, uuid[]) to authenticated;
