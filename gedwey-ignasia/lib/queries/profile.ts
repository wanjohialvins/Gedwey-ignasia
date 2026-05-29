import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  couple_id: string | null;
  partner_id: string | null;
  app_mode: 'discovery' | 'early_dating' | 'couples';
  relationship_stage: string | null;
  invite_code: string | null;
  expo_push_token: string | null;
}

// Fetch user profile
export const useUserProfile = (userId: string) => {
  return useQuery<Profile, Error>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Profile;
    },
    enabled: !!userId,
  });
};

// Update user profile fields (e.g. app_mode, relationship_stage, invite_code)
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<Profile, Error, Partial<Profile> & { id: string }>({
    mutationFn: async ({ id, ...fields }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
    },
  });
};

interface PairResult {
  success: boolean;
  error?: string;
  couple_id?: string;
  partner_id?: string;
  partner_display_name?: string;
}

// Pair with partner using their invite code
export const usePairPartner = () => {
  const queryClient = useQueryClient();

  return useMutation<PairResult, Error, { partnerCode: string; userId: string }>({
    mutationFn: async ({ partnerCode }) => {
      const { data, error } = await supabase.rpc('pair_user_by_invite_code', {
        partner_code: partnerCode,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as PairResult;
      if (!result.success) {
        throw new Error(result.error || 'Failed to pair with partner.');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate both user's profile queries to sync relationship/couple details
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
};

// Fetch couple details (e.g. streak)
export const useCouple = (coupleId: string) => {
  return useQuery({
    queryKey: ['couple', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!coupleId,
  });
};

// Unpair with partner
export const useUnpairPartner = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userId: string; partnerId: string }>({
    mutationFn: async ({ userId, partnerId }) => {
      // Update partner's profile first if it exists
      if (partnerId) {
        const { error: error1 } = await supabase
          .from('profiles')
          .update({ couple_id: null, partner_id: null })
          .eq('id', partnerId);
        
        if (error1) {
          throw new Error(error1.message);
        }
      }

      // Update current user's profile
      const { error: error2 } = await supabase
        .from('profiles')
        .update({ couple_id: null, partner_id: null })
        .eq('id', userId);

      if (error2) {
        throw new Error(error2.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      if (variables.partnerId) {
        queryClient.invalidateQueries({ queryKey: ['profile', variables.partnerId] });
      }
    },
  });
};
