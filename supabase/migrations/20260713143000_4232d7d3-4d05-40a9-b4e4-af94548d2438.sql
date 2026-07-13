ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '75 days');

UPDATE public.listings
SET expires_at = created_at + interval '75 days';

CREATE INDEX IF NOT EXISTS listings_expires_at_idx ON public.listings (expires_at) WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.expire_stale_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now();

  UPDATE public.promotions
  SET status = 'expired'
  WHERE status = 'active' AND ends_at <= now();
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_content() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';