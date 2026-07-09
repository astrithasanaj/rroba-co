CREATE OR REPLACE FUNCTION public.notify_pending_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.status = 'pending_payment' THEN
    PERFORM net.http_post(
      url := 'https://rroba-style-discover.lovable.app/api/public/notify-pending-promotion',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-token', '60563786757f0206debc0665c51fb61638eafbbd203617adecd055c045581198'
      ),
      body := jsonb_build_object('promotion_id', NEW.id)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_pending_promotion webhook enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_promotion_pending_notify ON public.promotions;
CREATE TRIGGER on_promotion_pending_notify
AFTER INSERT ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.notify_pending_promotion();