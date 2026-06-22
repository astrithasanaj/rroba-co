
-- Add brand + sold to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT '';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS sold boolean NOT NULL DEFAULT false;

-- Likes
CREATE TABLE IF NOT EXISTS public.listing_likes (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_likes TO authenticated;
GRANT SELECT ON public.listing_likes TO anon;
GRANT ALL ON public.listing_likes TO service_role;
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.listing_likes FOR SELECT USING (true);
CREATE POLICY "Users insert own likes" ON public.listing_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.listing_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Saves
CREATE TABLE IF NOT EXISTS public.listing_saves (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_saves TO authenticated;
GRANT ALL ON public.listing_saves TO service_role;
ALTER TABLE public.listing_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saves" ON public.listing_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saves" ON public.listing_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saves" ON public.listing_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  stars int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ratings_no_self CHECK (rater_id <> seller_id),
  UNIQUE (rater_id, seller_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT SELECT ON public.ratings TO anon;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users insert own ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users update own ratings" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = rater_id) WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users delete own ratings" ON public.ratings FOR DELETE TO authenticated USING (auth.uid() = rater_id);

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at_v2 BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.listing_likes REPLICA IDENTITY FULL;
ALTER TABLE public.listing_saves REPLICA IDENTITY FULL;
ALTER TABLE public.ratings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_saves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
