-- Couple songs table — run in Supabase SQL Editor after full-setup.sql
-- Shared music library per couple (Our Soundtrack screen)

CREATE TABLE IF NOT EXISTS couple_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  artist TEXT,
  embed_url TEXT,
  mood_tag TEXT,
  is_song_of_week BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_couple_songs_couple ON couple_songs (couple_id, created_at DESC);

ALTER TABLE couple_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members read songs" ON couple_songs;
CREATE POLICY "Couple members read songs" ON couple_songs
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL));

DROP POLICY IF EXISTS "Couple members insert songs" ON couple_songs;
CREATE POLICY "Couple members insert songs" ON couple_songs
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL)
    AND added_by = auth.uid()
  );

DROP POLICY IF EXISTS "Couple members update songs" ON couple_songs;
CREATE POLICY "Couple members update songs" ON couple_songs
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL));

DROP POLICY IF EXISTS "Couple members delete songs" ON couple_songs;
CREATE POLICY "Couple members delete songs" ON couple_songs
  FOR DELETE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL));

SELECT 'couple_songs table ready.' AS status;
