-- Exactly one workout plan per user can be the "active" plan (shown with an
-- Active pill on the Plans list, and later the plan driving the Workout
-- tab). Enforced with a partial unique index rather than a per-row check,
-- since Postgres has no direct "at most one true" constraint.
alter table public.workout_plans add column is_active boolean not null default false;

create unique index workout_plans_one_active_per_user
  on public.workout_plans (user_id)
  where is_active;

-- Activating a plan unsets any previously active plan for the same user and
-- moves the newly active plan to the top of the manual order, matching new
-- plans' own sort-first placement (see 20260906184811_new_plans_sort_first).
create or replace function public.set_active_plan(p_plan_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from public.workout_plans
  where id = p_plan_id and user_id = auth.uid();

  if v_user_id is null then
    raise exception 'Plan not found';
  end if;

  update public.workout_plans
  set is_active = false
  where user_id = v_user_id and is_active and id <> p_plan_id;

  update public.workout_plans
  set is_active = true,
      order_index = (
        select coalesce(min(order_index), 0) - 1
        from public.workout_plans
        where user_id = v_user_id
      )
  where id = p_plan_id;
end;
$$;

revoke all on function public.set_active_plan(uuid) from public;
grant execute on function public.set_active_plan(uuid) to authenticated;
