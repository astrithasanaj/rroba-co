
-- Lock down admin_users: only existing admins can grant/revoke admin
CREATE POLICY "Only admins can grant admin"
  ON public.admin_users FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can revoke admin"
  ON public.admin_users FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Restrict realtime.messages policy: postgres_changes only (no broadcast/presence),
-- scoped to the specific topics the app actually uses.
DROP POLICY IF EXISTS "Authenticated users can read photos feed channel" ON realtime.messages;

CREATE POLICY "App postgres_changes topics only"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    extension = 'postgres_changes'
    AND realtime.topic() = ANY (ARRAY[
      'photos-feed',
      'realtime:public:photos',
      'home-feed',
      'profile-live',
      'messages-list'
    ])
  );
