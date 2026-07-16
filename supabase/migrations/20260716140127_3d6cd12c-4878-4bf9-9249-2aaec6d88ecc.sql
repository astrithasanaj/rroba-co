DROP POLICY IF EXISTS "App postgres_changes topics only" ON realtime.messages;

CREATE POLICY "App postgres_changes scoped topics"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    extension = 'postgres_changes'
    AND (
      realtime.topic() = ANY (ARRAY['photos-feed', 'realtime:public:photos', 'home-feed'])
      OR realtime.topic() = 'messages-list:' || auth.uid()::text
      OR realtime.topic() = 'profile-live:' || auth.uid()::text
    )
  );