-- Which of the 5 bundled card-background photos (see
-- apps/mobile/assets/images/plan-card-background-*.jpg) a plan's card uses.
-- Assigned once at creation time (randomly, preferring images no other plan
-- is currently using) and kept for the plan's lifetime, rather than derived
-- from its position in the list — otherwise deleting a plan would visibly
-- reshuffle every plan after it.
alter table public.workout_plans
  add column background_image_index smallint check (background_image_index between 1 and 5);

-- Backfill existing rows so today's data isn't left null.
with numbered as (
  select id, row_number() over (order by order_index) as rn
  from public.workout_plans
)
update public.workout_plans p
set background_image_index = ((numbered.rn - 1) % 5) + 1
from numbered
where numbered.id = p.id;

alter table public.workout_plans
  alter column background_image_index set not null;
