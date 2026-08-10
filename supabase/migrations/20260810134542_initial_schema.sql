-- Profiles: one row per authenticated user, created automatically on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by their owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Creates a profile row whenever a new user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Exercises: a shared global catalog, extendable with per-user custom exercises.
create type public.muscle_group as enum (
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'cardio'
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group public.muscle_group not null,
  equipment text,
  created_by uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "Exercises are viewable by everyone"
  on public.exercises for select
  using (created_by is null or auth.uid() = created_by);

create policy "Users can create their own exercises"
  on public.exercises for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = created_by);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = created_by);

-- Workout plans: a named, multi-day training plan owned by a user.
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_plans enable row level security;

create policy "Users manage their own workout plans"
  on public.workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workout_plans_set_updated_at
  before update on public.workout_plans
  for each row execute function public.set_updated_at();

-- Plan days: the days/variants that make up a plan (e.g. "Day A", "Push").
create table public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  name text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique (plan_id, order_index)
);

alter table public.workout_plan_days enable row level security;

create policy "Users manage days of their own plans"
  on public.workout_plan_days for all
  using (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = workout_plan_days.plan_id
        and workout_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = workout_plan_days.plan_id
        and workout_plans.user_id = auth.uid()
    )
  );

-- Plan exercises: the exercises within a plan day, with their target sets/reps.
create table public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.workout_plan_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index integer not null,
  target_sets integer not null,
  target_reps text not null,
  target_weight_kg numeric,
  rest_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  unique (plan_day_id, order_index)
);

alter table public.workout_plan_exercises enable row level security;

create policy "Users manage exercises of their own plan days"
  on public.workout_plan_exercises for all
  using (
    exists (
      select 1 from public.workout_plan_days
      join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
      where workout_plan_days.id = workout_plan_exercises.plan_day_id
        and workout_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plan_days
      join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
      where workout_plan_days.id = workout_plan_exercises.plan_day_id
        and workout_plans.user_id = auth.uid()
    )
  );

create index workout_plan_days_plan_id_idx on public.workout_plan_days (plan_id);
create index workout_plan_exercises_plan_day_id_idx on public.workout_plan_exercises (plan_day_id);
create index workout_plan_exercises_exercise_id_idx on public.workout_plan_exercises (exercise_id);
create index exercises_created_by_idx on public.exercises (created_by);
