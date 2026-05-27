-- ====================================================
-- FIX FOR CARDS RLS POLICY (ALLOW GUEST ACCESS)
-- ====================================================

-- 1. Drop the old authenticated-only policy
DROP POLICY IF EXISTS "Anyone authenticated can view cards" ON public.cards;

-- 2. Re-create the policy to allow anyone (public) to view cards
CREATE POLICY "Anyone can view cards" ON public.cards
  FOR SELECT TO public USING (true);
