CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings(status);
CREATE INDEX IF NOT EXISTS listings_sold_created_idx ON public.listings(sold, created_at DESC);
CREATE INDEX IF NOT EXISTS listing_likes_user_idx ON public.listing_likes(user_id);
CREATE INDEX IF NOT EXISTS listing_saves_user_idx ON public.listing_saves(user_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_idx ON public.conversations(last_message_at DESC);