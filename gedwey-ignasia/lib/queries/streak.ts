import { supabase } from '../supabase';

export const incrementStreak = async (coupleId: string): Promise<number | null> => {
  if (!coupleId) return null;
  try {
    const { data, error } = await supabase.rpc('increment_couple_streak', { p_couple_id: coupleId });
    if (error) {
      console.warn('[Streak] RPC failed, skipping:', error.message);
      return null;
    }
    return data as number;
  } catch {
    return null;
  }
};
