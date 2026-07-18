-- Restrict column-level UPDATE on public.profiles to prevent users from
-- modifying sensitive fields (membership, moderation, audit, verification).
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  name,
  display_name,
  username,
  avatar_url,
  city,
  city_id,
  bio,
  height_cm,
  preferences,
  onboarding_completed,
  first_name,
  last_name,
  phone,
  date_of_birth,
  gender
) ON public.profiles TO authenticated;