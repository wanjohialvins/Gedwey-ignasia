-- ====================================================
-- GEDWEY IGNASIA — PAIRING FUNCTION
-- ====================================================

CREATE OR REPLACE FUNCTION pair_user_by_invite_code(partner_code TEXT)
RETURNS jsonb AS $$
DECLARE
  partner_profile RECORD;
  current_user_profile RECORD;
  new_couple_id UUID;
BEGIN
  -- 1. Get current user's profile
  SELECT * INTO current_user_profile FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your profile was not found.');
  END IF;
  
  -- Check if already paired
  IF current_user_profile.couple_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already paired with a partner.');
  END IF;

  -- 2. Find partner by invite code
  SELECT * INTO partner_profile FROM public.profiles WHERE invite_code = partner_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code.');
  END IF;
  
  -- Check if trying to pair with self
  IF partner_profile.id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot pair with your own invite code.');
  END IF;

  -- Check if partner is already paired
  IF partner_profile.couple_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This partner is already paired.');
  END IF;

  -- 3. Create a new couple
  INSERT INTO public.couples (streak) VALUES (0) RETURNING id INTO new_couple_id;
  
  -- 4. Update current user's profile
  UPDATE public.profiles 
  SET couple_id = new_couple_id, partner_id = partner_profile.id
  WHERE id = auth.uid();
  
  -- 5. Update partner's profile
  UPDATE public.profiles 
  SET couple_id = new_couple_id, partner_id = auth.uid()
  WHERE id = partner_profile.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'couple_id', new_couple_id, 
    'partner_id', partner_profile.id,
    'partner_display_name', partner_profile.display_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
