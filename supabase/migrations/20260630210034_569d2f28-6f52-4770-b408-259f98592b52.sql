ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS subcategory text;
CREATE INDEX IF NOT EXISTS listings_subcategory_idx ON public.listings (subcategory);