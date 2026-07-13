
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_tier text CHECK (membership_tier IN ('basic','mid','pro')),
  ADD COLUMN IF NOT EXISTS top_of_list_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_placement_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_renewed_at timestamptz;

-- Extend the sensitive-fields trigger to block direct credit manipulation
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN RAISE EXCEPTION 'Cannot modify is_blocked'; END IF;
  IF NEW.blocked_at IS DISTINCT FROM OLD.blocked_at THEN RAISE EXCEPTION 'Cannot modify blocked_at'; END IF;
  IF NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason THEN RAISE EXCEPTION 'Cannot modify blocked_reason'; END IF;
  IF NEW.signup_ip IS DISTINCT FROM OLD.signup_ip THEN RAISE EXCEPTION 'Cannot modify signup_ip'; END IF;
  IF NEW.signup_device IS DISTINCT FROM OLD.signup_device THEN RAISE EXCEPTION 'Cannot modify signup_device'; END IF;
  IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg THEN RAISE EXCEPTION 'Cannot modify rating_avg'; END IF;
  IF NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN RAISE EXCEPTION 'Cannot modify rating_count'; END IF;
  IF NEW.membership_tier IS DISTINCT FROM OLD.membership_tier THEN RAISE EXCEPTION 'Cannot modify membership_tier'; END IF;
  IF NEW.top_of_list_credits IS DISTINCT FROM OLD.top_of_list_credits THEN RAISE EXCEPTION 'Cannot modify top_of_list_credits'; END IF;
  IF NEW.paid_placement_days IS DISTINCT FROM OLD.paid_placement_days THEN RAISE EXCEPTION 'Cannot modify paid_placement_days'; END IF;
  IF NEW.membership_renewed_at IS DISTINCT FROM OLD.membership_renewed_at THEN RAISE EXCEPTION 'Cannot modify membership_renewed_at'; END IF;

  RETURN NEW;
END;
$function$;

-- Renew: reset (no rollover) to tier's monthly allocation
CREATE OR REPLACE FUNCTION public.renew_membership(_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tol int; v_pp int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _tier NOT IN ('basic','mid','pro') THEN RAISE EXCEPTION 'Invalid tier'; END IF;

  IF _tier = 'basic' THEN v_tol := 5;  v_pp := 5;
  ELSIF _tier = 'mid' THEN v_tol := 12; v_pp := 12;
  ELSE                    v_tol := 20; v_pp := 30;
  END IF;

  UPDATE public.profiles
     SET membership_tier = _tier,
         top_of_list_credits = v_tol,
         paid_placement_days = v_pp,
         membership_renewed_at = now()
   WHERE id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.renew_membership(text) TO authenticated;

-- Consume credit + create active promotion in one atomic call
CREATE OR REPLACE FUNCTION public.consume_promotion_credit(
  _listing_id uuid,
  _kind text,            -- 'top_of_list' | 'paid_placement'
  _days integer          -- required only for paid_placement
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_promo_id uuid;
  v_type text;
  v_duration int;
  v_available int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id INTO v_owner FROM public.listings WHERE id = _listing_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF v_owner <> v_uid THEN RAISE EXCEPTION 'Not your listing'; END IF;

  IF _kind = 'top_of_list' THEN
    v_type := 'category_top';
    v_duration := 2; -- 48h stored as 2 days
    UPDATE public.profiles
       SET top_of_list_credits = top_of_list_credits - 1
     WHERE id = v_uid AND top_of_list_credits > 0
    RETURNING top_of_list_credits INTO v_available;
    IF v_available IS NULL THEN
      RAISE EXCEPTION 'no_top_of_list_credits';
    END IF;
    INSERT INTO public.promotions (
      listing_id, seller_id, type, duration_days, price_eur,
      starts_at, ends_at, status, payment_confirmed, payment_confirmed_at, payment_method
    ) VALUES (
      _listing_id, v_uid, v_type, v_duration, 0,
      now(), now() + interval '48 hours', 'active', true, now(), 'membership_credit'
    ) RETURNING id INTO v_promo_id;

  ELSIF _kind = 'paid_placement' THEN
    IF _days IS NULL OR _days < 1 THEN RAISE EXCEPTION 'Invalid days'; END IF;
    v_type := 'feed_top';
    UPDATE public.profiles
       SET paid_placement_days = paid_placement_days - _days
     WHERE id = v_uid AND paid_placement_days >= _days
    RETURNING paid_placement_days INTO v_available;
    IF v_available IS NULL THEN
      RAISE EXCEPTION 'no_paid_placement_days';
    END IF;
    INSERT INTO public.promotions (
      listing_id, seller_id, type, duration_days, price_eur,
      starts_at, ends_at, status, payment_confirmed, payment_confirmed_at, payment_method
    ) VALUES (
      _listing_id, v_uid, v_type, _days, 0,
      now(), now() + make_interval(days => _days), 'active', true, now(), 'membership_credit'
    ) RETURNING id INTO v_promo_id;

  ELSE
    RAISE EXCEPTION 'Invalid kind';
  END IF;

  RETURN v_promo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_promotion_credit(uuid, text, integer) TO authenticated;
