ALTER VIEW public.public_profiles SET (security_invoker = false);

COMMENT ON VIEW public.public_profiles IS
  'Public, safe projection of profiles (name, avatar, city, search_slug, ratings, etc.). Runs with definer rights (security_invoker=false) so search and public profile views can read safe public fields for other users while the base profiles table remains protected by RLS. Do not enable security_invoker — it restricts results to the caller own profile/admin rows and breaks cross-user profile search.';