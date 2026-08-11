-- Split the "arms" category into "biceps" and "triceps". "arms" itself is
-- intentionally left in the enum (not removed) since dropping a value would
-- require rebuilding the type and every dependent column; existing rows/apps
-- referencing it keep working, it's just no longer offered in the UI.
alter type public.muscle_group add value 'biceps';
alter type public.muscle_group add value 'triceps';
