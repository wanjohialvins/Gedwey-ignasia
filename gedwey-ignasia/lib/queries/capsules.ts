import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface TimeCapsule {
  id: string;
  created_at: string;
  couple_id: string;
  creator_id: string;
  title: string;
  content: string;
  image_url: string | null;
  open_date: string;
  is_opened: boolean;
  profiles?: {
    display_name: string | null;
  };
}

// Fetch all time capsules for a couple ordered by opening date
export const useTimeCapsules = (coupleId: string) => {
  return useQuery<TimeCapsule[], Error>({
    queryKey: ['timeCapsules', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];

      const { data, error } = await supabase
        .from('time_capsules')
        .select('*, profiles:creator_id(display_name)')
        .eq('couple_id', coupleId)
        .order('open_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return (data || []) as TimeCapsule[];
    },
    enabled: !!coupleId,
  });
};

// Fetch a single time capsule by ID
export const useTimeCapsule = (capsuleId: string) => {
  return useQuery<TimeCapsule, Error>({
    queryKey: ['timeCapsule', capsuleId],
    queryFn: async () => {
      if (!capsuleId) throw new Error('Capsule ID is required');

      const { data, error } = await supabase
        .from('time_capsules')
        .select('*, profiles:creator_id(display_name)')
        .eq('id', capsuleId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as TimeCapsule;
    },
    enabled: !!capsuleId,
  });
};

// Create a new time capsule
export const useCreateTimeCapsule = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TimeCapsule,
    Error,
    { coupleId: string; creatorId: string; title: string; content: string; imageUrl?: string; openDate: string }
  >({
    mutationFn: async ({ coupleId, creatorId, title, content, imageUrl, openDate }) => {
      const { data, error } = await supabase
        .from('time_capsules')
        .insert({
          couple_id: coupleId,
          creator_id: creatorId,
          title,
          content,
          image_url: imageUrl || null,
          open_date: openDate,
        })
        .select('*, profiles:creator_id(display_name)')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as TimeCapsule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timeCapsules', data.couple_id] });
    },
  });
};

// Open/Reveal a time capsule (sets is_opened = true)
export const useOpenTimeCapsule = () => {
  const queryClient = useQueryClient();

  return useMutation<TimeCapsule, Error, { capsuleId: string; coupleId: string }>({
    mutationFn: async ({ capsuleId }) => {
      const { data, error } = await supabase
        .from('time_capsules')
        .update({ is_opened: true })
        .eq('id', capsuleId)
        .select('*, profiles:creator_id(display_name)')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as TimeCapsule;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeCapsules', variables.coupleId] });
      queryClient.invalidateQueries({ queryKey: ['timeCapsule', variables.capsuleId] });
    },
  });
};
