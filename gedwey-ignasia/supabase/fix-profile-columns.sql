-- Fix missing profiles columns (run once in Supabase SQL Editor)
-- Resolves: "Could not find the 'theme_preference' column of 'profiles' in the schema cache"

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#2563EB';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mature_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mature_mode_age_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dev_mode BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS love_language TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Optional: enforce allowed theme values (skip if you use more themes later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_theme_preference_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_theme_preference_check
      CHECK (theme_preference IN ('default', 'dark', 'soft', 'midnight', 'rose', 'forest', 'cream', 'slate'));
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Reload PostgREST schema cache so the API sees new columns immediately
NOTIFY pgrst, 'reload schema';
