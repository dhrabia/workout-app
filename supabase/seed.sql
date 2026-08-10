-- Global exercise catalog (created_by = null), available to every user.
insert into public.exercises (name, muscle_group, equipment) values
  ('Barbell Back Squat', 'legs', 'barbell'),
  ('Barbell Deadlift', 'back', 'barbell'),
  ('Barbell Bench Press', 'chest', 'barbell'),
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Barbell Row', 'back', 'barbell'),
  ('Pull-Up', 'back', 'bodyweight'),
  ('Push-Up', 'chest', 'bodyweight'),
  ('Dumbbell Bicep Curl', 'arms', 'dumbbell'),
  ('Tricep Pushdown', 'arms', 'cable'),
  ('Leg Press', 'legs', 'machine'),
  ('Lat Pulldown', 'back', 'cable'),
  ('Plank', 'core', 'bodyweight'),
  ('Running', 'cardio', null);
