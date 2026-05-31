-- Improvements 3.0 profile columns (run on existing Supabase projects)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS love_language TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mature_mode_age_verified BOOLEAN DEFAULT FALSE NOT NULL;
