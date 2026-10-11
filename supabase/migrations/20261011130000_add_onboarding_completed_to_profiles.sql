-- Whether the user has finished the first-run onboarding questionnaire.
-- New profiles (created by handle_new_user on signup) start as not completed.
alter table public.profiles
  add column onboarding_completed boolean not null default false;
