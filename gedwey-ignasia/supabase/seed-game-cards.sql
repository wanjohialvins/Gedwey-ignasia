-- ============================================================
-- GEDWEY IGNASIA — GAME CARDS TABLE + RLS
-- Run this FIRST, then run seed-game-cards-data.sql
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_game_cards_type_category ON game_cards (game_type, category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_game_cards_age_gate ON game_cards (age_gate) WHERE is_active = TRUE;

ALTER TABLE game_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active game cards" ON game_cards;
CREATE POLICY "Anyone can read active game cards" ON game_cards
  FOR SELECT TO authenticated, anon
  USING (is_active = TRUE);

-- No client writes — cards are admin-seeded only

SELECT 'game_cards table ready. Now run seed-game-cards-data.sql' AS status;
