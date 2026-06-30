-- Enable pg_net for outbound HTTP from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: fire-and-forget POST to app webhook
CREATE OR REPLACE FUNCTION public.notify_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://rroba-style-discover.lovable.app/api/public/notify-new-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-token', '60563786757f0206debc0665c51fb61638eafbbd203617adecd055c045581198'
    ),
    body := jsonb_build_object('report_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- never block the insert if the webhook call cannot be enqueued
  RAISE WARNING 'notify_new_report webhook enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_created_notify ON public.reports;
CREATE TRIGGER on_report_created_notify
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_report();