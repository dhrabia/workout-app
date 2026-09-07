-- Body measurements move from a single current-value row per user to an
-- append-only history, mirroring weight_logs: "current" is simply the most
-- recent row per (user, measurement_type), and the full history backs a
-- per-measurement chart + editable list on the new Body Measurements screen.
create type public.measurement_type as enum ('chest', 'waist', 'hips', 'arm', 'thigh', 'neck');

create table public.body_measurement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  measurement_type public.measurement_type not null,
  value_cm numeric not null,
  logged_at timestamptz not null default now()
);

alter table public.body_measurement_logs enable row level security;

create policy "Users manage their own body measurement logs"
  on public.body_measurement_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index body_measurement_logs_user_id_type_logged_at_idx
  on public.body_measurement_logs (user_id, measurement_type, logged_at desc);

-- Backfill: one log row per non-null column of the old single-row table,
-- dated at its last update.
insert into public.body_measurement_logs (user_id, measurement_type, value_cm, logged_at)
select user_id, 'chest'::public.measurement_type, chest_cm, updated_at from public.body_measurements where chest_cm is not null
union all
select user_id, 'waist'::public.measurement_type, waist_cm, updated_at from public.body_measurements where waist_cm is not null
union all
select user_id, 'hips'::public.measurement_type, hips_cm, updated_at from public.body_measurements where hips_cm is not null
union all
select user_id, 'arm'::public.measurement_type, arm_cm, updated_at from public.body_measurements where arm_cm is not null
union all
select user_id, 'thigh'::public.measurement_type, thigh_cm, updated_at from public.body_measurements where thigh_cm is not null
union all
select user_id, 'neck'::public.measurement_type, neck_cm, updated_at from public.body_measurements where neck_cm is not null;

drop trigger if exists body_measurements_set_updated_at on public.body_measurements;
drop table public.body_measurements;
