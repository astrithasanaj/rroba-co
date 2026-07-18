ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_min_age_check
  CHECK (date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '16 years'));