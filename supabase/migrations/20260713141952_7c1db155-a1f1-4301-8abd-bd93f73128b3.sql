-- 1. expires_at column on listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '75 days');

UPDATE public.listings
SET expires_at = created_at + interval '75 days'
WHERE expires_at IS NULL OR expires_at = created_at + interval '75 days' AND created_at < now() - interval '1 minute';

CREATE INDEX IF NOT EXISTS listings_expires_at_idx ON public.listings (expires_at) WHERE status = 'active';

-- 2. expire function
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

-- 3. pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-content-daily') THEN
    PERFORM cron.unschedule('expire-stale-content-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'expire-stale-content-daily',
  '0 3 * * *',
  $$SELECT public.expire_stale_content();$$
);