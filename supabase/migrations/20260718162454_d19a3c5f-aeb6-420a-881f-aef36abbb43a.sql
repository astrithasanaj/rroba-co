DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-content-daily') THEN
    PERFORM cron.unschedule('expire-stale-content-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'expire-stale-content-daily',
  '0 3 * * *',
  $$
  SELECT public.expire_stale_content();
  SELECT public.reveal_pending_ratings();
  $$
);