CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.listings WHERE id = NEW.listing_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, data)
    VALUES (v_owner, 'like', jsonb_build_object('listing_id', NEW.listing_id, 'liker_id', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listing_likes_notify ON public.listing_likes;
CREATE TRIGGER listing_likes_notify AFTER INSERT ON public.listing_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_on_sold()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sold_to_user_id IS NOT NULL AND (OLD.sold_to_user_id IS NULL OR OLD.sold_to_user_id <> NEW.sold_to_user_id) THEN
    INSERT INTO public.notifications (user_id, type, data)
    VALUES (NEW.sold_to_user_id, 'sold', jsonb_build_object('listing_id', NEW.id, 'seller_id', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_sold_notify ON public.listings;
CREATE TRIGGER listings_sold_notify AFTER UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_sold();

REVOKE EXECUTE ON FUNCTION public.notify_on_sold() FROM PUBLIC, anon, authenticated;