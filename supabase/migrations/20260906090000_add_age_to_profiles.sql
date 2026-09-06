-- Age: a directly-entered value (not derived from a date of birth, which
-- this app doesn't collect), editable from the Profile screen's Personal
-- Information section via a wheel picker.
alter table public.profiles
  add column age smallint;
