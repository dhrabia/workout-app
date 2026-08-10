-- Swaps order_index between two sibling plan days via a -1 sentinel, so the
-- UNIQUE(plan_id, order_index) constraint is never transiently violated.
-- security invoker: RLS on the underlying selects/updates does the authorization.
create or replace function public.swap_plan_day_order(day_id_a uuid, day_id_b uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  order_a integer;
  order_b integer;
  plan_a uuid;
  plan_b uuid;
begin
  select order_index, plan_id into order_a, plan_a from public.workout_plan_days where id = day_id_a;
  select order_index, plan_id into order_b, plan_b from public.workout_plan_days where id = day_id_b;

  if plan_a is null or plan_b is null then
    raise exception 'one or both days not found';
  end if;
  if plan_a <> plan_b then
    raise exception 'days must belong to the same plan';
  end if;

  update public.workout_plan_days set order_index = -1      where id = day_id_a;
  update public.workout_plan_days set order_index = order_a where id = day_id_b;
  update public.workout_plan_days set order_index = order_b where id = day_id_a;
end;
$$;

revoke all on function public.swap_plan_day_order(uuid, uuid) from public;
grant execute on function public.swap_plan_day_order(uuid, uuid) to authenticated;

-- Same swap, for exercises within a plan day.
create or replace function public.swap_plan_exercise_order(exercise_id_a uuid, exercise_id_b uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  order_a integer;
  order_b integer;
  day_a uuid;
  day_b uuid;
begin
  select order_index, plan_day_id into order_a, day_a from public.workout_plan_exercises where id = exercise_id_a;
  select order_index, plan_day_id into order_b, day_b from public.workout_plan_exercises where id = exercise_id_b;

  if day_a is null or day_b is null then
    raise exception 'one or both plan exercises not found';
  end if;
  if day_a <> day_b then
    raise exception 'exercises must belong to the same plan day';
  end if;

  update public.workout_plan_exercises set order_index = -1      where id = exercise_id_a;
  update public.workout_plan_exercises set order_index = order_a where id = exercise_id_b;
  update public.workout_plan_exercises set order_index = order_b where id = exercise_id_a;
end;
$$;

revoke all on function public.swap_plan_exercise_order(uuid, uuid) from public;
grant execute on function public.swap_plan_exercise_order(uuid, uuid) to authenticated;
