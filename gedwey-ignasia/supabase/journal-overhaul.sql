-- ============================================================
-- SQL Overhaul - Add Voice and Mood tracking to Journal Entries
-- Run in Supabase SQL Editor — idempotent and safe to run
-- ============================================================

ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS voice_duration INTEGER;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS mood TEXT;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

SELECT 'Journal entries database table overhauled successfully.' AS status;
