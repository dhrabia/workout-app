-- Plans had no manual ordering until now (the list was sorted by created_at).
-- Add order_index following the same pattern already used for
-- workout_plan_days/workout_plan_exercises: a sentinel default of -1 so
-- generated Insert types treat it as optional, a BEFORE INSERT trigger that
-- assigns the next index when the client omits it, and a UNIQUE constraint
-- (scoped to the owning user, since plans have no other parent) enforced via
-- the same two-pass sentinel update in the bulk reorder RPC below.
alter table public.workout_plans add column order_index integer not null default -1;

with numbered as (
  select id, row_number() over (partition by user_id order by created_at desc) - 1 as rn
  from public.workout_plans
)
update public.workout_plans as wp
set order_index = numbered.rn
from numbered
where wp.id = numbered.id;

alter table public.workout_plans
  add constraint workout_plans_user_id_order_index_key unique (user_id, order_index);

create or replace function public.assign_next_plan_order_index()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_index is null or new.order_index = -1 then
    select coalesce(max(order_index), -1) + 1 into new.order_index
    from public.workout_plans
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger workout_plans_assign_order_index
  before insert on public.workout_plans
  for each row execute function public.assign_next_plan_order_index();

create or replace function public.reorder_plans(
  p_plan_ids uuid[]
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
  from public.workout_plans
  where user_id = auth.uid() and id = any(p_plan_ids);

  select count(*) into existing_count
  from public.workout_plans
  where user_id = auth.uid();

  if given_count <> coalesce(array_length(p_plan_ids, 1), 0)
     or given_count <> existing_count then
    raise exception 'p_plan_ids must exactly match all plans owned by the caller';
  end if;

  update public.workout_plans as wp
  set order_index = -(t.idx)
  from unnest(p_plan_ids) with ordinality as t(id, idx)
  where wp.id = t.id;

  update public.workout_plans as wp
  set order_index = t.idx - 1
  from unnest(p_plan_ids) with ordinality as t(id, idx)
  where wp.id = t.id;
end;
$$;

revoke all on function public.reorder_plans(uuid[]) from public;
grant execute on function public.reorder_plans(uuid[]) to authenticated;
