
-- 1. credit_purchases table
CREATE TABLE public.credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('paid_placement_days','top_of_list_credits')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  price_eur NUMERIC(6,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','confirmed','refused')),
  payment_method TEXT,
  payment_reference TEXT,
  payment_confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_purchases_user ON public.credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_status ON public.credit_purchases(status);

GRANT SELECT, INSERT ON public.credit_purchases TO authenticated;
GRANT ALL ON public.credit_purchases TO service_role;

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credit purchases"
  ON public.credit_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users insert own credit purchases"
  ON public.credit_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending_payment');

CREATE POLICY "Admins update credit purchases"
  ON public.credit_purchases FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_credit_purchases_updated_at
  BEFORE UPDATE ON public.credit_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Trigger to apply credits on confirm
CREATE OR REPLACE FUNCTION public.apply_credit_purchase_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    IF NEW.kind = 'paid_placement_days' THEN
      UPDATE public.profiles
         SET paid_placement_days = COALESCE(paid_placement_days,0) + NEW.amount
       WHERE id = NEW.user_id;
    ELSIF NEW.kind = 'top_of_list_credits' THEN
      UPDATE public.profiles
         SET top_of_list_credits = COALESCE(top_of_list_credits,0) + NEW.amount
       WHERE id = NEW.user_id;
    END IF;
    NEW.payment_confirmed_at := COALESCE(NEW.payment_confirmed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS credit_purchase_on_confirm ON public.credit_purchases;
CREATE TRIGGER credit_purchase_on_confirm
  BEFORE UPDATE ON public.credit_purchases
  FOR EACH ROW EXECUTE FUNCTION public.apply_credit_purchase_on_confirm();

-- 3. Rework consume_promotion_credit to accept a promotion type directly
CREATE OR REPLACE FUNCTION public.consume_promotion_credit(_listing_id uuid, _kind text, _days integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_promo_id uuid;
  v_available int;
  v_duration int;
  v_type text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id INTO v_owner FROM public.listings WHERE id = _listing_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF v_owner <> v_uid THEN RAISE EXCEPTION 'Not your listing'; END IF;

  IF _kind IN ('feed_top','category_top','paid_placement') THEN
    IF _days IS NULL OR _days < 1 THEN RAISE EXCEPTION 'Invalid days'; END IF;
    v_type := CASE WHEN _kind = 'paid_placement' THEN 'feed_top' ELSE _kind END;
    v_duration := _days;

    UPDATE public.profiles
       SET paid_placement_days = paid_placement_days - _days
     WHERE id = v_uid AND paid_placement_days >= _days
    RETURNING paid_placement_days INTO v_available;
    IF v_available IS NULL THEN RAISE EXCEPTION 'no_paid_placement_days'; END IF;

  ELSIF _kind IN ('search_top','top_of_list') THEN
    v_type := 'search_top';
    v_duration := 30;

    UPDATE public.profiles
       SET top_of_list_credits = top_of_list_credits - 1
     WHERE id = v_uid AND top_of_list_credits > 0
    RETURNING top_of_list_credits INTO v_available;
    IF v_available IS NULL THEN RAISE EXCEPTION 'no_top_of_list_credits'; END IF;

  ELSE
    RAISE EXCEPTION 'Invalid kind';
  END IF;

  INSERT INTO public.promotions (
    listing_id, seller_id, type, duration_days, price_eur,
    starts_at, ends_at, status, payment_confirmed, payment_confirmed_at, payment_method
  ) VALUES (
    _listing_id, v_uid, v_type, v_duration, 0,
    now(), now() + make_interval(days => v_duration), 'active', true, now(), 'membership_credit'
  ) RETURNING id INTO v_promo_id;

  RETURN v_promo_id;
END;
$$;
