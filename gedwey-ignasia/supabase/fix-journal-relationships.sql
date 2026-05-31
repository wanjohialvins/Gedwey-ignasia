-- ============================================================
-- Fix PostgREST profile joins (journal, capsules, health, etc.)
-- Run in Supabase SQL Editor — idempotent, safe to re-run
-- ============================================================
-- Cause: creator_id / user_id referenced auth.users(id), but app queries use:
--   .select('*, profiles:creator_id(display_name)')
-- PostgREST only infers joins from FK constraints → needs profiles(id).

-- Backfill profiles for any referenced user ids missing a profile row
INSERT INTO public.profiles (id, display_name, app_mode)
SELECT DISTINCT src.uid, 'User', 'discovery'
FROM (
  SELECT creator_id AS uid FROM public.journal_entries WHERE creator_id IS NOT NULL
  UNION SELECT creator_id FROM public.time_capsules WHERE creator_id IS NOT NULL
  UNION SELECT user_id FROM public.health_checkins WHERE user_id IS NOT NULL
  UNION SELECT creator_id FROM public.shared_items WHERE creator_id IS NOT NULL
  UNION SELECT user_id FROM public.activity_logs WHERE user_id IS NOT NULL
  UNION SELECT creator_id FROM public.discovery_sessions WHERE creator_id IS NOT NULL
  UNION SELECT user1_id FROM public.sessions WHERE user1_id IS NOT NULL
  UNION SELECT user2_id FROM public.sessions WHERE user2_id IS NOT NULL
  UNION SELECT added_by FROM public.couple_songs WHERE added_by IS NOT NULL
) src
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = src.uid)
ON CONFLICT (id) DO NOTHING;

-- Helper: drop existing FK on column, add FK → profiles(id)
CREATE OR REPLACE FUNCTION public._repoint_user_fk_to_profiles(
  p_table text,
  p_column text,
  p_on_delete text DEFAULT 'CASCADE'
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  con record;
  new_con text := p_table || '_' || p_column || '_fkey';
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN
    RAISE NOTICE 'Table % does not exist, skipping', p_table;
    RETURN;
  END IF;

  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND t.relname = p_table
      AND c.contype = 'f'
      AND a.attname = p_column
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table, con.conname);
  END LOOP;

  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE %s',
    p_table, new_con, p_column, p_on_delete
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint % already exists on %.%', new_con, p_table, p_column;
END;
$$;

SELECT public._repoint_user_fk_to_profiles('journal_entries', 'creator_id', 'CASCADE');
SELECT public._repoint_user_fk_to_profiles('time_capsules', 'creator_id', 'CASCADE');
SELECT public._repoint_user_fk_to_profiles('health_checkins', 'user_id', 'CASCADE');
SELECT public._repoint_user_fk_to_profiles('shared_items', 'creator_id', 'SET NULL');
SELECT public._repoint_user_fk_to_profiles('activity_logs', 'user_id', 'SET NULL');
SELECT public._repoint_user_fk_to_profiles('discovery_sessions', 'creator_id', 'CASCADE');
SELECT public._repoint_user_fk_to_profiles('sessions', 'user1_id', 'CASCADE');
SELECT public._repoint_user_fk_to_profiles('sessions', 'user2_id', 'SET NULL');

-- couple_songs.added_by should already reference profiles; ensure anyway
DO $$ BEGIN
  PERFORM public._repoint_user_fk_to_profiles('couple_songs', 'added_by', 'SET NULL');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'couple_songs table not found — run couple-songs.sql or fix-all-schema.sql';
END $$;

DROP FUNCTION IF EXISTS public._repoint_user_fk_to_profiles(text, text, text);

NOTIFY pgrst, 'reload schema';

SELECT 'PostgREST profile relationships fixed. Journal/capsule/health joins should work.' AS status;
