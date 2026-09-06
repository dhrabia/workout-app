-- Body tracking: profile-level goal fields plus two per-user resources
-- backing the Body screen (current weight/target, weight history, BMI,
-- body measurements).

alter table public.profiles
  add column height_cm numeric,
  add column target_weight_kg numeric;

-- Weight logs: an append-mostly history of weigh-ins. "Current weight" is
-- simply the most recent row per user; the weight-progress chart reads the
-- full history.
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric not null,
  logged_at timestamptz not null default now()
);

alter table public.weight_logs enable row level security;

create policy "Users manage their own weight logs"
  on public.weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index weight_logs_user_id_logged_at_idx on public.weight_logs (user_id, logged_at desc);

-- Body measurements: one editable row per user (current values only, no
-- history), matching the profiles/workout_plans updated_at convention.
create table public.body_measurements (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  neck_cm numeric,
  updated_at timestamptz not null default now()
);

alter table public.body_measurements enable row level security;

create policy "Users manage their own body measurements"
  on public.body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger body_measurements_set_updated_at
  before update on public.body_measurements
  for each row execute function public.set_updated_at();
