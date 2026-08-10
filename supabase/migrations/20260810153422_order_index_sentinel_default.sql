-- order_index needs a column default so it's typed as optional in generated
-- TypeScript Insert types (codegen can't see that the BEFORE INSERT triggers
-- added in the previous migration already fill it in). -1 is the same
-- sentinel already used internally by the swap_plan_*_order RPCs, and is
-- never the value actually persisted.
alter table public.workout_plan_days alter column order_index set default -1;
alter table public.workout_plan_exercises alter column order_index set default -1;

create or replace function public.assign_next_plan_day_order_index()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_index is null or new.order_index = -1 then
    select coalesce(max(order_index), -1) + 1 into new.order_index
    from public.workout_plan_days
    where plan_id = new.plan_id;
  end if;
  return new;
end;
$$;

create or replace function public.assign_next_plan_exercise_order_index()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_index is null or new.order_index = -1 then
    select coalesce(max(order_index), -1) + 1 into new.order_index
    from public.workout_plan_exercises
    where plan_day_id = new.plan_day_id;
  end if;
  return new;
end;
$$;
