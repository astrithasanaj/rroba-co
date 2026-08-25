CREATE TABLE public.listing_sales (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_sales TO authenticated;
GRANT ALL ON public.listing_sales TO service_role;

ALTER TABLE public.listing_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view sale" ON public.listing_sales
  FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Seller can record sale" ON public.listing_sales
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = seller_id
    AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  );

CREATE POLICY "Seller can update sale" ON public.listing_sales
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Seller can delete sale" ON public.listing_sales
  FOR DELETE TO authenticated
  USING (auth.uid() = seller_id);

CREATE TRIGGER update_listing_sales_updated_at
  BEFORE UPDATE ON public.listing_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.listing_sales (listing_id, seller_id, buyer_id)
SELECT l.id, l.user_id, l.sold_to_user_id
FROM public.listings l
WHERE l.sold_to_user_id IS NOT NULL
ON CONFLICT (listing_id) DO NOTHING;

ALTER TABLE public.listings DROP COLUMN sold_to_user_id;