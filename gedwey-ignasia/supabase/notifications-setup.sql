-- ====================================================
-- GEDWEY IGNASIA — NOTIFICATIONS SETUP
-- ====================================================

-- Add expo_push_token column to profiles table if it does not already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Verify columns by selecting
-- SELECT id, display_name, expo_push_token FROM public.profiles LIMIT 1;
