CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

GRANT SELECT ON public.followers TO anon;
GRANT SELECT, INSERT, DELETE ON public.followers TO authenticated;
GRANT ALL ON public.followers TO service_role;

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Followers are viewable by everyone"
ON public.followers FOR SELECT USING (true);

CREATE POLICY "Users can follow"
ON public.followers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.followers FOR DELETE TO authenticated
USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS followers_following_idx ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS followers_follower_idx ON public.followers(follower_id);

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (NEW.following_id, 'new_follower', jsonb_build_object('follower_id', NEW.follower_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.followers;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();