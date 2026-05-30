-- Add avatar_url column to profiles if it doesn't already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Reload the PostgREST schema cache to make the new column immediately accessible
NOTIFY pgrst, 'reload schema';
