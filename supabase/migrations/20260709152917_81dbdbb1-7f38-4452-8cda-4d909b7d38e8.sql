
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS signup_ip TEXT,
  ADD COLUMN IF NOT EXISTS signup_device TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- 2. blocked_identifiers table
CREATE TABLE IF NOT EXISTS public.blocked_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('email','phone','ip')),
  value TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE (type, value)
);

GRANT ALL ON public.blocked_identifiers TO service_role;
-- No anon/authenticated grants: reads go through security-definer RPCs.

ALTER TABLE public.blocked_identifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blocked identifiers"
  ON public.blocked_identifiers FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert blocked identifiers"
  ON public.blocked_identifiers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete blocked identifiers"
  ON public.blocked_identifiers FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Public RPC: check if an email or phone is banned. Returns boolean only.
CREATE OR REPLACE FUNCTION public.is_signup_blocked(_email TEXT, _phone TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_identifiers
    WHERE (_email IS NOT NULL AND type = 'email' AND value = lower(_email))
       OR (_phone IS NOT NULL AND _phone <> '' AND type = 'phone' AND value = _phone)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_signup_blocked(TEXT, TEXT) TO anon, authenticated;

-- 4. Username availability check (used during signup)
CREATE OR REPLACE FUNCTION public.is_username_available(_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;
