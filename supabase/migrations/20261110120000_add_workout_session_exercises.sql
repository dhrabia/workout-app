-- Per-exercise detail of a completed workout, for the Workout Summary screen
-- (SCRUM-9). workout_sessions only kept the summary totals, so nothing said
-- which exercises were done or what was lifted on each set.
--
-- exercise_id points at the catalog for the exercise's current name/muscle
-- group, but is set null (not cascaded) if that exercise is later deleted —
-- exercise_name/muscle_group are snapshotted alongside it for that case, the
-- same reason workout_sessions denormalizes plan_name/day_name. The logged
-- sets are stored as a jsonb array of {"weight_kg", "reps"} objects in set
-- order: they're written once with the session and never edited, so a
-- separate sets table would only add a join.
create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  exercise_name text not null,
  muscle_group public.muscle_group not null,
  order_index integer not null,
  sets jsonb not null default '[]'::jsonb,
  unique (session_id, order_index)
);

alter table public.workout_session_exercises enable row level security;

create policy "Users manage exercises of their own workout sessions"
  on public.workout_session_exercises for all
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and ws.user_id = auth.uid()
    )
  );

-- Saves a session together with its exercises in one transaction, so a
-- failed second insert can't leave a summary row in history whose details
-- are missing. p_exercises is a JSON array in workout order of
-- {"exercise_id", "exercise_name", "muscle_group", "sets": [{"weight_kg", "reps"}]};
-- order_index comes from each element's position.
create or replace function public.save_workout_session(
  p_session jsonb,
  p_exercises jsonb
)
returns public.workout_sessions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved public.workout_sessions;
begin
  insert into public.workout_sessions (
    plan_id,
    plan_day_id,
    plan_name,
    day_name,
    exercise_count,
    duration_minutes,
    total_sets,
    total_volume_kg,
    calories_estimate
  )
  values (
    (p_session ->> 'plan_id')::uuid,
    (p_session ->> 'plan_day_id')::uuid,
    p_session ->> 'plan_name',
    p_session ->> 'day_name',
    (p_session ->> 'exercise_count')::integer,
    (p_session ->> 'duration_minutes')::integer,
    (p_session ->> 'total_sets')::integer,
    (p_session ->> 'total_volume_kg')::numeric,
    (p_session ->> 'calories_estimate')::integer
  )
  returning * into saved;

  insert into public.workout_session_exercises (
    session_id,
    exercise_id,
    exercise_name,
    muscle_group,
    order_index,
    sets
  )
  select
    saved.id,
    (t.exercise ->> 'exercise_id')::uuid,
    t.exercise ->> 'exercise_name',
    (t.exercise ->> 'muscle_group')::public.muscle_group,
    (t.idx - 1)::integer,
    coalesce(t.exercise -> 'sets', '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_exercises, '[]'::jsonb)) with ordinality as t(exercise, idx);

  return saved;
end;
$$;

revoke all on function public.save_workout_session(jsonb, jsonb) from public;
grant execute on function public.save_workout_session(jsonb, jsonb) to authenticated;
