
CREATE OR REPLACE FUNCTION public.notify_on_save()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.listings WHERE id = NEW.listing_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, data)
    VALUES (v_owner, 'save', jsonb_build_object('listing_id', NEW.listing_id, 'saver_id', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_on_save ON public.listing_saves;
CREATE TRIGGER trg_notify_on_save
AFTER INSERT ON public.listing_saves
FOR EACH ROW EXECUTE FUNCTION public.notify_on_save();
