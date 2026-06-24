DROP POLICY IF EXISTS "System and participants insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.listing_likes;
CREATE POLICY "Users view own likes" ON public.listing_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);