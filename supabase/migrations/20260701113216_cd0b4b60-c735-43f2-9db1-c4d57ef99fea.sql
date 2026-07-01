
-- Create protected admin_users table
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id)
);

GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins (self-check on same table is fine here — no recursion because policy is SELECT-only and function below is SECURITY DEFINER)
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- No INSERT/UPDATE/DELETE policies: only service role can modify.
-- Admin access is managed exclusively via Supabase dashboard. Never expose service role key client-side.

-- Rewrite is_admin() to read from admin_users
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid);
$$;

-- Lock down execution to authenticated only (revoke from anon/public)
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Drop vulnerable is_admin column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Restrict profile update policy: prevent id changes (is_admin no longer exists)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
