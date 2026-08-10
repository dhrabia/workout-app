-- Owner columns default to the caller, so clients don't need to pass
-- user_id/created_by explicitly (RLS already trusts auth.uid() for these).
alter table public.workout_plans alter column user_id set default auth.uid();
alter table public.exercises alter column created_by set default auth.uid();

-- Auto-assigns order_index on insert when the caller omits it, so clients
-- don't need a separate select-max round trip before inserting (and can't
-- race two concurrent inserts onto the same order_index).
create or replace function public.assign_next_plan_day_order_index()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_index is null then
    select coalesce(max(order_index), -1) + 1 into new.order_index
    from public.workout_plan_days
    where plan_id = new.plan_id;
  end if;
  return new;
end;
$$;

create trigger workout_plan_days_assign_order_index
  before insert on public.workout_plan_days
  for each row execute function public.assign_next_plan_day_order_index();

-- Same for exercises within a plan day.
create or replace function public.assign_next_plan_exercise_order_index()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_index is null then
    select coalesce(max(order_index), -1) + 1 into new.order_index
    from public.workout_plan_exercises
    where plan_day_id = new.plan_day_id;
  end if;
  return new;
end;
$$;

create trigger workout_plan_exercises_assign_order_index
  before insert on public.workout_plan_exercises
  for each row execute function public.assign_next_plan_exercise_order_index();
