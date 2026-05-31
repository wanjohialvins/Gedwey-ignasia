-- ============================================================
-- GEDWEY IGNASIA — CONSOLIDATED SCHEMA FIX (idempotent)
-- Paste once in Supabase SQL Editor to align DB with the app
-- ============================================================

-- ---------- 1. CORE TABLES (create if missing) ----------
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  display_name TEXT,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  app_mode TEXT DEFAULT 'discovery',
  relationship_stage TEXT,
  invite_code TEXT UNIQUE,
  expo_push_token TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'default',
  accent_color TEXT DEFAULT '#4F46E5',
  mature_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  mature_mode_age_verified BOOLEAN DEFAULT FALSE NOT NULL,
  dev_mode BOOLEAN DEFAULT TRUE NOT NULL,
  bio TEXT,
  love_language TEXT,
  birthday DATE,
  preferences JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  min_relationship_stage TEXT
);

CREATE TABLE IF NOT EXISTS discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  creator_answer TEXT NOT NULL,
  guest_name TEXT,
  guest_answer TEXT,
  token TEXT UNIQUE NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  user1_id UUID NOT NULL,
  user2_id UUID,
  user1_mood TEXT,
  user2_mood TEXT,
  user1_answer TEXT,
  user2_answer TEXT,
  user1_voice_url TEXT,
  user2_voice_url TEXT,
  user1_voice_duration INTEGER,
  user2_voice_duration INTEGER,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS health_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 10),
  intimacy INTEGER NOT NULL CHECK (intimacy BETWEEN 1 AND 10),
  trust INTEGER NOT NULL CHECK (trust BETWEEN 1 AND 10),
  connection INTEGER NOT NULL CHECK (connection BETWEEN 1 AND 10),
  conflict INTEGER NOT NULL CHECK (conflict BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  open_date TIMESTAMPTZ NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS game_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN (
    'truth_or_dare', 'would_you_rather', 'this_or_that', 'rapid_fire', 'deep_questions'
  )),
  category TEXT NOT NULL CHECK (category IN ('fun', 'deep', 'playful', 'mature')),
  prompt TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  is_dare BOOLEAN DEFAULT FALSE NOT NULL,
  age_gate BOOLEAN DEFAULT FALSE NOT NULL,
  suitable_for_stage TEXT[] DEFAULT ARRAY['discovery','early_dating','couples'],
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS couple_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  added_by UUID,
  title TEXT NOT NULL,
  artist TEXT,
  embed_url TEXT,
  mood_tag TEXT,
  is_song_of_week BOOLEAN DEFAULT FALSE NOT NULL
);

-- ---------- 2. PROFILE & SESSION COLUMN PATCHES ----------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#4F46E5';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mature_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mature_mode_age_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dev_mode BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS love_language TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user1_voice_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user2_voice_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user1_voice_duration INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user2_voice_duration INTEGER;

CREATE INDEX IF NOT EXISTS idx_game_cards_type_category ON game_cards (game_type, category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_couple_songs_couple ON couple_songs (couple_id, created_at DESC);

-- ---------- 3. POSTGREST FK FIX (user columns → profiles, not auth.users) ----------
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
  IF to_regclass('public.' || p_table) IS NULL THEN RETURN; END IF;

  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND t.relname = p_table AND c.contype = 'f' AND a.attname = p_column
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table, con.conname);
  END LOOP;

  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE %s',
      p_table, new_con, p_column, p_on_delete
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
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
SELECT public._repoint_user_fk_to_profiles('couple_songs', 'added_by', 'SET NULL');

DROP FUNCTION IF EXISTS public._repoint_user_fk_to_profiles(text, text, text);

-- sessions.card_id → cards (PostgREST: cards(*)) — ensure FK exists
DO $$ BEGIN
  ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- discovery_sessions.card_id → cards
DO $$ BEGIN
  ALTER TABLE public.discovery_sessions
    ADD CONSTRAINT discovery_sessions_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- 4. HELPER + PAIRING ----------
CREATE OR REPLACE FUNCTION public.get_my_couple_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT couple_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.pair_user_by_invite_code(partner_code TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  partner_profile RECORD;
  current_user_profile RECORD;
  new_couple_id UUID;
BEGIN
  SELECT * INTO current_user_profile FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Your profile was not found.'); END IF;
  IF current_user_profile.couple_id IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'You are already paired.'); END IF;

  SELECT * INTO partner_profile FROM public.profiles WHERE invite_code = upper(trim(partner_code));
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code.'); END IF;
  IF partner_profile.id = auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'Cannot pair with yourself.'); END IF;
  IF partner_profile.couple_id IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Partner already paired.'); END IF;

  INSERT INTO public.couples (streak) VALUES (0) RETURNING id INTO new_couple_id;
  UPDATE public.profiles SET couple_id = new_couple_id, partner_id = partner_profile.id, updated_at = now() WHERE id = auth.uid();
  UPDATE public.profiles SET couple_id = new_couple_id, partner_id = auth.uid(), updated_at = now() WHERE id = partner_profile.id;

  RETURN jsonb_build_object('success', true, 'couple_id', new_couple_id, 'partner_id', partner_profile.id, 'partner_display_name', partner_profile.display_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pair_user_by_invite_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, app_mode)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'discovery')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- 5. RLS ----------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own couple" ON couples;
CREATE POLICY "Users can view their own couple" ON couples FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.couple_id = couples.id AND profiles.id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update their own couple" ON couples;
CREATE POLICY "Users can update their own couple" ON couples FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.couple_id = couples.id AND profiles.id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view profiles in same couple" ON profiles;
CREATE POLICY "Users can view profiles in same couple" ON profiles FOR SELECT USING (
  id = auth.uid() OR (couple_id IS NOT NULL AND couple_id = public.get_my_couple_id())
);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view cards" ON cards;
CREATE POLICY "Anyone can view cards" ON cards FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Couple members can view sessions" ON sessions;
CREATE POLICY "Couple members can view sessions" ON sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = sessions.couple_id)
);
DROP POLICY IF EXISTS "Couple members can insert sessions" ON sessions;
CREATE POLICY "Couple members can insert sessions" ON sessions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = sessions.couple_id)
);
DROP POLICY IF EXISTS "Couple members can update sessions" ON sessions;
CREATE POLICY "Couple members can update sessions" ON sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = sessions.couple_id)
);

DROP POLICY IF EXISTS "Couple members can view journal" ON journal_entries;
DROP POLICY IF EXISTS "Couple members can manage journal" ON journal_entries;
DROP POLICY IF EXISTS "Couple members can view journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Couple members can manage journal entries" ON journal_entries;
CREATE POLICY "Couple members can view journal" ON journal_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = journal_entries.couple_id)
);
CREATE POLICY "Couple members can manage journal" ON journal_entries FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = journal_entries.couple_id)
);

DROP POLICY IF EXISTS "Couple members can view health" ON health_checkins;
DROP POLICY IF EXISTS "Couple members can add health" ON health_checkins;
CREATE POLICY "Couple members can view health" ON health_checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = health_checkins.couple_id)
);
CREATE POLICY "Couple members can add health" ON health_checkins FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = health_checkins.couple_id)
);

DROP POLICY IF EXISTS "Couple members can view capsules" ON time_capsules;
DROP POLICY IF EXISTS "Couple members can manage capsules" ON time_capsules;
CREATE POLICY "Couple members can view capsules" ON time_capsules FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = time_capsules.couple_id)
);
CREATE POLICY "Couple members can manage capsules" ON time_capsules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = time_capsules.couple_id)
);

DROP POLICY IF EXISTS "Couple members can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Couple members can add activity logs" ON activity_logs;
CREATE POLICY "Couple members can view activity logs" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = activity_logs.couple_id)
);
CREATE POLICY "Couple members can add activity logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = activity_logs.couple_id)
);

DROP POLICY IF EXISTS "Couple members can view shared items" ON shared_items;
DROP POLICY IF EXISTS "Couple members can manage shared items" ON shared_items;
CREATE POLICY "Couple members can view shared items" ON shared_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = shared_items.couple_id)
);
CREATE POLICY "Couple members can manage shared items" ON shared_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.couple_id = shared_items.couple_id)
);

DROP POLICY IF EXISTS "Anyone can read active game cards" ON game_cards;
CREATE POLICY "Anyone can read active game cards" ON game_cards FOR SELECT TO authenticated, anon USING (is_active = TRUE);

DROP POLICY IF EXISTS "Couple members read songs" ON couple_songs;
DROP POLICY IF EXISTS "Couple members insert songs" ON couple_songs;
DROP POLICY IF EXISTS "Couple members update songs" ON couple_songs;
DROP POLICY IF EXISTS "Couple members delete songs" ON couple_songs;
CREATE POLICY "Couple members read songs" ON couple_songs FOR SELECT TO authenticated USING (
  couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL)
);
CREATE POLICY "Couple members insert songs" ON couple_songs FOR INSERT TO authenticated WITH CHECK (
  couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL) AND added_by = auth.uid()
);
CREATE POLICY "Couple members update songs" ON couple_songs FOR UPDATE TO authenticated USING (
  couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL)
);
CREATE POLICY "Couple members delete songs" ON couple_songs FOR DELETE TO authenticated USING (
  couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL)
);

-- Discovery session policies
DROP POLICY IF EXISTS "Users can view own discovery sessions" ON discovery_sessions;
DROP POLICY IF EXISTS "Users can create discovery sessions" ON discovery_sessions;
DROP POLICY IF EXISTS "Guests can read discovery by token" ON discovery_sessions;
DROP POLICY IF EXISTS "Guests can update discovery by token" ON discovery_sessions;
CREATE POLICY "Users can view own discovery sessions" ON discovery_sessions FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Users can create discovery sessions" ON discovery_sessions FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Guests can read discovery by token" ON discovery_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Guests can update discovery by token" ON discovery_sessions FOR UPDATE TO anon USING (true);

-- ---------- 6. STORAGE ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Gedwey upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Gedwey upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Gedwey public read media" ON storage.objects;
CREATE POLICY "Gedwey upload profile images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Gedwey upload voice notes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Gedwey public read media" ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('profile-images', 'voice-notes'));

NOTIFY pgrst, 'reload schema';

SELECT 'fix-all-schema.sql applied. Run seed-game-cards-data.sql if game_cards is empty.' AS status;
