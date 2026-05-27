import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface HealthCheckin {
  id: string;
  created_at: string;
  couple_id: string;
  user_id: string;
  communication: number;
  intimacy: number;
  trust: number;
  connection: number;
  conflict: number;
  profiles?: {
    display_name: string | null;
  };
}

// Fetch all health check-ins for a couple
export const useHealthCheckins = (coupleId: string) => {
  return useQuery<HealthCheckin[], Error>({
    queryKey: ['healthCheckins', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];

      const { data, error } = await supabase
        .from('health_checkins')
        .select('*, profiles:user_id(display_name)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return (data || []) as HealthCheckin[];
    },
    enabled: !!coupleId,
  });
};

// Create a new health check-in
export const useCreateHealthCheckin = () => {
  const queryClient = useQueryClient();

  return useMutation<
    HealthCheckin,
    Error,
    {
      coupleId: string;
      userId: string;
      communication: number;
      intimacy: number;
      trust: number;
      connection: number;
      conflict: number;
    }
  >({
    mutationFn: async ({ coupleId, userId, communication, intimacy, trust, connection, conflict }) => {
      const { data, error } = await supabase
        .from('health_checkins')
        .insert({
          couple_id: coupleId,
          user_id: userId,
          communication,
          intimacy,
          trust,
          connection,
          conflict,
        })
        .select('*, profiles:user_id(display_name)')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as HealthCheckin;
    },
    onSuccess: (data) => {
      // Invalidate the health list for this couple
      queryClient.invalidateQueries({ queryKey: ['healthCheckins', data.couple_id] });
    },
  });
};
