
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT SELECT ON public.photos TO anon;
GRANT ALL ON public.photos TO service_role;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos are viewable by everyone"
  ON public.photos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own photos"
  ON public.photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON public.photos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON public.photos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
ALTER TABLE public.photos REPLICA IDENTITY FULL;

-- Storage policies for photos bucket
CREATE POLICY "Photo files are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photo files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
