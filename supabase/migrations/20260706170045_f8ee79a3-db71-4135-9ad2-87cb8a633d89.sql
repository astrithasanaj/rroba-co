
ALTER TABLE public.profiles ALTER COLUMN bio DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN bio SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN city SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN preferences DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN preferences SET DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, display_name, username, bio, avatar_url, city, height_cm,
    preferences, onboarding_completed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL, '', NULL, '', NULL, '{}'::jsonb, FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
