-- A completed workout's summary, saved once from the Workout tab's "Workout
-- complete!" screen (Save workout). plan_id/plan_day_id are kept nullable
-- and set null (not cascaded) if the plan/day is later deleted or renamed —
-- history should outlive the plan it came from, which is why plan_name/
-- day_name are denormalized here rather than joined at read time.
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  plan_id uuid references public.workout_plans (id) on delete set null,
  plan_day_id uuid references public.workout_plan_days (id) on delete set null,
  plan_name text not null,
  day_name text not null,
  exercise_count integer not null,
  duration_minutes integer not null,
  total_sets integer not null,
  total_volume_kg numeric not null,
  calories_estimate integer not null,
  completed_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

create policy "Users manage their own workout sessions"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Workout History always reads most-recent-first, optionally windowed to the
-- last week/month — this index serves both the plain order and the range
-- filter on the same leading columns.
create index workout_sessions_user_id_completed_at_idx
  on public.workout_sessions (user_id, completed_at desc);
