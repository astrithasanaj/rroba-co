-- Revert public_profiles view to security_invoker = false.
-- INTENTIONAL: this view exposes only a safe, public allow-list of columns
-- (id, name, avatar_url, city, etc.) and MUST bypass the underlying
-- profiles RLS (which restricts rows to auth.uid() = id). With
-- security_invoker = true, follower/following lists and other-user profile
-- views return empty results because callers cannot read other users' rows
-- through the base table. Do not "fix" the linter warning by flipping this
-- back to true — the view is deliberately a public projection.
ALTER VIEW public.public_profiles SET (security_invoker = false);
COMMENT ON VIEW public.public_profiles IS
  'Public, safe projection of profiles (name, avatar, city, etc.). Runs with definer rights (security_invoker=false) so it bypasses profiles RLS. Do not enable security_invoker — it will break follower lists and public profile views.';