-- ====================================================
-- FIX FOR PROFILE RLS RECURSION
-- ====================================================

-- 1. Create a security definer function to get current user's couple_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_couple_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT couple_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old recursive policy
DROP POLICY IF EXISTS "Users can view profiles in same couple" ON public.profiles;

-- 3. Re-create the policy using the security definer function
CREATE POLICY "Users can view profiles in same couple" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    (couple_id IS NOT NULL AND couple_id = public.get_my_couple_id())
  );
