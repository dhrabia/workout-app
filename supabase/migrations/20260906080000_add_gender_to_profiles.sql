-- Gender: a simple two-value enum, editable from the Profile screen's
-- Personal Information section.
create type public.gender as enum ('male', 'female');

alter table public.profiles
  add column gender public.gender;
