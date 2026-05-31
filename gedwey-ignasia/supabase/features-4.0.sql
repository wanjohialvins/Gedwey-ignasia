-- Features 4.0: game answers, cycle tracking, important dates, cat care, streak helpers

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('default', 'dark', 'soft', 'midnight', 'rose', 'forest', 'cream', 'slate'));

CREATE TABLE IF NOT EXISTS game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  answer_text TEXT,
  option_chosen TEXT,
  option_a TEXT,
  option_b TEXT,
  game_card_id TEXT
);

ALTER TABLE game_answers ADD COLUMN IF NOT EXISTS answer_text TEXT;
ALTER TABLE game_answers ADD COLUMN IF NOT EXISTS option_chosen TEXT;
UPDATE game_answers SET answer_text = answer WHERE answer_text IS NULL AND answer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_answers_couple ON game_answers(couple_id, created_at DESC);
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members view game answers" ON game_answers;
CREATE POLICY "Couple members view game answers" ON game_answers
  FOR SELECT USING (couple_id = public.get_my_couple_id());

DROP POLICY IF EXISTS "Couple members insert game answers" ON game_answers;
CREATE POLICY "Couple members insert game answers" ON game_answers
  FOR INSERT WITH CHECK (couple_id = public.get_my_couple_id() AND user_id = auth.uid());

DROP POLICY IF EXISTS "Couple members update game answers" ON game_answers;
CREATE POLICY "Couple members update game answers" ON game_answers
  FOR UPDATE USING (couple_id = public.get_my_couple_id() AND user_id = auth.uid());

CREATE TABLE IF NOT EXISTS cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  flow_strength TEXT CHECK (flow_strength IN ('none', 'spotting', 'light', 'medium', 'heavy')),
  mood TEXT,
  symptoms TEXT,
  notes TEXT,
  predicted_next DATE,
  UNIQUE(couple_id, log_date)
);

ALTER TABLE cycle_logs ADD COLUMN IF NOT EXISTS predicted_next DATE;

CREATE INDEX IF NOT EXISTS idx_cycle_logs_couple ON cycle_logs(couple_id, log_date DESC);
ALTER TABLE cycle_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members manage cycle logs" ON cycle_logs;
CREATE POLICY "Couple members manage cycle logs" ON cycle_logs
  FOR ALL USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE TABLE IF NOT EXISTS important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  recurring BOOLEAN DEFAULT TRUE NOT NULL,
  repeats_yearly BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT
);

ALTER TABLE important_dates ADD COLUMN IF NOT EXISTS repeats_yearly BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE important_dates ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT TRUE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_important_dates_couple ON important_dates(couple_id, event_date);
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members manage important dates" ON important_dates;
CREATE POLICY "Couple members manage important dates" ON important_dates
  FOR ALL USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

-- Couple pet (interactive live stats)
CREATE TABLE IF NOT EXISTS couple_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT DEFAULT 'Whiskers' NOT NULL,
  hunger INTEGER DEFAULT 50 NOT NULL,
  happiness INTEGER DEFAULT 50 NOT NULL,
  cleanliness INTEGER DEFAULT 50 NOT NULL,
  last_fed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  last_bathed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pet_care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  care_type TEXT NOT NULL CHECK (care_type IN ('feed', 'scratch', 'bathe'))
);

ALTER TABLE couple_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_care_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members manage pets" ON couple_pets;
CREATE POLICY "Couple members manage pets" ON couple_pets
  FOR ALL USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id());

DROP POLICY IF EXISTS "Couple members log pet care" ON pet_care_logs;
CREATE POLICY "Couple members log pet care" ON pet_care_logs
  FOR ALL USING (couple_id = public.get_my_couple_id())
  WITH CHECK (couple_id = public.get_my_couple_id() AND user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.increment_couple_streak(p_couple_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER;
  v_last DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT streak, (updated_at AT TIME ZONE 'UTC')::DATE
  INTO v_streak, v_last
  FROM couples WHERE id = p_couple_id FOR UPDATE;

  IF v_last = v_today THEN
    RETURN v_streak;
  ELSIF v_last = v_today - 1 THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;

  UPDATE couples SET streak = v_streak, updated_at = now() WHERE id = p_couple_id;
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_couple_streak(UUID) TO authenticated;
