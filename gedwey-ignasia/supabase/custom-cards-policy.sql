-- ====================================================
-- RLS POLICY FOR CUSTOM CARD CREATION
-- ====================================================

-- Allow authenticated users to insert cards
CREATE POLICY "Users can insert cards" ON public.cards
  FOR INSERT TO authenticated WITH CHECK (true);
