
-- 1. Storage UPDATE policy: only the owner (first path segment = auth.uid) can update
CREATE POLICY "Users can update their own photo files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Realtime channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read photos feed channel"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() IN ('photos-feed', 'realtime:public:photos')
    AND extension IN ('postgres_changes', 'broadcast', 'presence')
  );
