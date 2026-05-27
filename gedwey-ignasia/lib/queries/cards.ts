import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface Card {
  id: string;
  created_at: string;
  text: string;
  category: 'discovery' | 'intimacy' | 'fun' | 'relationship_health';
  min_relationship_stage: string | null;
}

// Fetch questions/cards filtered by category
export const useCards = (category?: 'discovery' | 'intimacy' | 'fun' | 'relationship_health') => {
  return useQuery<Card[], Error>({
    queryKey: ['cards', category],
    queryFn: async () => {
      let query = supabase.from('cards').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Card[];
    },
  });
};
