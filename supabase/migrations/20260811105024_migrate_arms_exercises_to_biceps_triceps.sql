-- Reassign existing "arms" exercises to "biceps"/"triceps" by name. Any "arms"
-- exercise whose name doesn't clearly say which (e.g. a generic custom
-- exercise) is left as "arms" rather than guessed at.
update public.exercises
set muscle_group = 'biceps'
where muscle_group = 'arms' and name ilike '%bicep%';

update public.exercises
set muscle_group = 'triceps'
where muscle_group = 'arms' and name ilike '%tricep%';
