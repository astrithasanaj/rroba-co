
-- 1. Drop the overly-permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2. Users can read their own full profile
CREATE POLICY "Users can read own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Admins can read all profiles (including sensitive columns)
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 4. Public safe-columns view. SECURITY DEFINER (default) so anon + authenticated
--    can read display-only fields without a permissive RLS policy on the base table.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
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

-- 5. Trigger to block user-facing UPDATEs from mutating sensitive/admin-only fields.
--    Admins and the service_role bypass by design.
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role and admins to update anything
  IF auth.role() = 'service_role' OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
    RAISE EXCEPTION 'Cannot modify is_blocked';
  END IF;
  IF NEW.blocked_at IS DISTINCT FROM OLD.blocked_at THEN
    RAISE EXCEPTION 'Cannot modify blocked_at';
  END IF;
  IF NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason THEN
    RAISE EXCEPTION 'Cannot modify blocked_reason';
  END IF;
  IF NEW.signup_ip IS DISTINCT FROM OLD.signup_ip THEN
    RAISE EXCEPTION 'Cannot modify signup_ip';
  END IF;
  IF NEW.signup_device IS DISTINCT FROM OLD.signup_device THEN
    RAISE EXCEPTION 'Cannot modify signup_device';
  END IF;
  IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg THEN
    RAISE EXCEPTION 'Cannot modify rating_avg';
  END IF;
  IF NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
    RAISE EXCEPTION 'Cannot modify rating_count';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_field_protection ON public.profiles;
CREATE TRIGGER enforce_profile_field_protection
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sensitive_profile_update();
