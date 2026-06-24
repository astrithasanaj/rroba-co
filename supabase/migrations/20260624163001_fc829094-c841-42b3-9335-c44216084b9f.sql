ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_image_paths_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_image_paths_check CHECK (array_length(image_paths, 1) >= 1 AND array_length(image_paths, 1) <= 10);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.listings ALTER COLUMN description SET DEFAULT '';