
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS sold_to_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ratings 
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Users insert own ratings" ON public.ratings;
CREATE POLICY "Users insert own ratings" ON public.ratings FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = rater_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.buyer_id = rater_id AND c.seller_id = seller_id)
       OR (c.buyer_id = seller_id AND c.seller_id = rater_id)
  )
);

CREATE OR REPLACE FUNCTION public.recompute_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a uuid; v_b uuid;
BEGIN
  v_a := COALESCE(NEW.seller_id, OLD.seller_id);
  v_b := COALESCE(NEW.rater_id, OLD.rater_id);
  UPDATE public.profiles p SET
    rating_avg = COALESCE((
      SELECT AVG(r.stars)::numeric(3,2) FROM public.ratings r
      WHERE r.seller_id = p.id
        AND (
          EXISTS (SELECT 1 FROM public.ratings r2 WHERE r2.rater_id = r.seller_id AND r2.seller_id = r.rater_id)
          OR r.created_at <= now() - interval '14 days'
        )
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.ratings r
      WHERE r.seller_id = p.id
        AND (
          EXISTS (SELECT 1 FROM public.ratings r2 WHERE r2.rater_id = r.seller_id AND r2.seller_id = r.rater_id)
          OR r.created_at <= now() - interval '14 days'
        )
    )
  WHERE p.id IN (v_a, v_b);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.reveal_pending_ratings()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles p SET
    rating_avg = COALESCE((
      SELECT AVG(r.stars)::numeric(3,2) FROM public.ratings r
      WHERE r.seller_id = p.id
        AND (
          EXISTS (SELECT 1 FROM public.ratings r2 WHERE r2.rater_id = r.seller_id AND r2.seller_id = r.rater_id)
          OR r.created_at <= now() - interval '14 days'
        )
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.ratings r
      WHERE r.seller_id = p.id
        AND (
          EXISTS (SELECT 1 FROM public.ratings r2 WHERE r2.rater_id = r.seller_id AND r2.seller_id = r.rater_id)
          OR r.created_at <= now() - interval '14 days'
        )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reveal_pending_ratings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reveal_pending_ratings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reveal_pending_ratings() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_pending_ratings() TO service_role;
