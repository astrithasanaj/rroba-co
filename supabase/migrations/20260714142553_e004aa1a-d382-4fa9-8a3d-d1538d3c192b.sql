-- Recreate public_profiles view with security_invoker so it enforces the caller's RLS rather than the view owner's.
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  display_name,
  username,
  avatar_url,
  bio,
  city,
  city_id,
  rating_avg,
  rating_count,
  created_at
FROM public.profiles
WHERE COALESCE(is_blocked, false) = false;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- With security_invoker, the view now needs an RLS policy on profiles that lets
-- anon and authenticated read non-blocked rows (matching what the view previously exposed).
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (COALESCE(is_blocked, false) = false);
