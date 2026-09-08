-- Baseline for the user's current target (see computeWeightProgress in
-- apps/mobile/lib/weight.ts for why this can't just be weight_logs[0]).
alter table public.profiles
  add column goal_start_weight_kg numeric;

-- Existing users may already have a target without a recorded starting
-- point for it. Seed it from their most recent weigh-in (their "current
-- weight") so their progress bar doesn't disappear or reset to a stale
-- historical value the first time this baseline is read.
update public.profiles p
set goal_start_weight_kg = (
  select wl.weight_kg
  from public.weight_logs wl
  where wl.user_id = p.id
  order by wl.logged_at desc
  limit 1
)
where p.target_weight_kg is not null;
