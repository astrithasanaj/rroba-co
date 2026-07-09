CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('feed_top','category_top','search_top')),
  duration_days INTEGER NOT NULL,
  price_eur NUMERIC(6,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','active','expired','refused')),
  payment_method TEXT,
  payment_reference TEXT,
  payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  payment_confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promotions_listing ON public.promotions(listing_id);
CREATE INDEX idx_promotions_seller ON public.promotions(seller_id);
CREATE INDEX idx_promotions_status ON public.promotions(status);
CREATE INDEX idx_promotions_ends_at ON public.promotions(ends_at);
CREATE INDEX idx_promotions_type_status ON public.promotions(type, status);

GRANT SELECT, INSERT, UPDATE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own promotions"
  ON public.promotions FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE POLICY "Sellers can insert own promotions"
  ON public.promotions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id AND status = 'pending_payment');

CREATE POLICY "Admins can update promotions"
  ON public.promotions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
