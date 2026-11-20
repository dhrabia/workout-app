-- Onboarding's Gender step offers "Prefer not to say" as an explicit answer,
-- distinct from never having answered (gender is null).
alter type public.gender add value 'prefer_not_to_say';
