-- Watchlist and Recommendations table — run in Supabase SQL Editor
-- Shared watchlist per couple (Watchlist Recommendations screen)

CREATE TABLE IF NOT EXISTS watchlist_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'show' NOT NULL, -- 'show', 'movie', 'anime', 'other'
  note TEXT,
  link TEXT,
  is_watched BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watchlist_recs_couple ON watchlist_recommendations (couple_id, created_at DESC);

ALTER TABLE watchlist_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members read watchlist" ON watchlist_recommendations;
CREATE POLICY "Couple members read watchlist" ON watchlist_recommendations
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL));

DROP POLICY IF EXISTS "Couple members insert watchlist" ON watchlist_recommendations;
CREATE POLICY "Couple members insert watchlist" ON watchlist_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL)
    AND added_by = auth.uid()
  );

DROP POLICY IF EXISTS "Couple members update watchlist" ON watchlist_recommendations;
CREATE POLICY "Couple members update watchlist" ON watchlist_recommendations
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL));

DROP POLICY IF EXISTS "Couple members delete watchlist" ON watchlist_recommendations;
CREATE POLICY "Couple members delete watchlist" ON watchlist_recommendations
  FOR DELETE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL));

SELECT 'watchlist_recommendations table ready.' AS status;
