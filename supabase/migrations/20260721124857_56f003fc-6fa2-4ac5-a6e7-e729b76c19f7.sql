-- Enable trigram extension for substring search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Generated normalized search column: lowercased, with spaces, hyphens, underscores, and dots stripped
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS search_slug text
  GENERATED ALWAYS AS (
    lower(regexp_replace(
      coalesce(username, '') || ' ' || coalesce(display_name, '') || ' ' || coalesce(name, ''),
      '[[:space:]_.\-]', '', 'g'
    )) 
  ) STORED;

-- Trigram GIN index for fast case-insensitive substring/prefix search
CREATE INDEX IF NOT EXISTS profiles_search_slug_trgm_idx
  ON public.profiles USING gin (search_slug gin_trgm_ops);

-- Rebuild the public_profiles view to expose search_slug
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, name, display_name, username, avatar_url, bio, city, city_id,
         rating_avg, rating_count, created_at, search_slug
    FROM public.profiles
   WHERE COALESCE(is_blocked, false) = false;

GRANT SELECT ON public.public_profiles TO anon, authenticated;