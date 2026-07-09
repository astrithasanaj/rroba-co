CREATE TABLE IF NOT EXISTS public.gdpr_deletion_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.gdpr_deletion_log TO service_role;

ALTER TABLE public.gdpr_deletion_log ENABLE ROW LEVEL SECURITY;
-- No policies: authenticated/anon have no access; service_role bypasses RLS.