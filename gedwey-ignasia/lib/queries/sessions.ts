import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Card } from './cards';

export interface CoupleSession {
  id: string;
  created_at: string;
  couple_id: string;
  card_id: string;
  user1_id: string;
  user2_id: string | null;
  user1_mood: string | null;
  user2_mood: string | null;
  user1_answer: string | null;
  user2_answer: string | null;
  completed: boolean;
  completed_at: string | null;
  cards?: Card;
}

// Fetch active (incomplete) session for a couple
export const useActiveSession = (coupleId: string) => {
  return useQuery<CoupleSession | null, Error>({
    queryKey: ['activeSession', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;

      const { data, error } = await supabase
        .from('sessions')
        .select('*, cards(*)')
        .eq('couple_id', coupleId)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as CoupleSession | null;
    },
    enabled: !!coupleId,
    refetchInterval: 3000, // Poll every 3 seconds for partner updates
  });
};

// Fetch completed sessions for a couple (history)
export const useSessionHistory = (coupleId: string) => {
  return useQuery<CoupleSession[], Error>({
    queryKey: ['sessionHistory', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];

      const { data, error } = await supabase
        .from('sessions')
        .select('*, cards(*)')
        .eq('couple_id', coupleId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return (data || []) as CoupleSession[];
    },
    enabled: !!coupleId,
  });
};

// Create a new session
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CoupleSession,
    Error,
    { coupleId: string; cardId: string; userId: string; mood: string }
  >({
    mutationFn: async ({ coupleId, cardId, userId, mood }) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          couple_id: coupleId,
          card_id: cardId,
          user1_id: userId,
          user1_mood: mood,
        })
        .select('*, cards(*)')
        .single();

      if (error) throw new Error(error.message);
      return data as CoupleSession;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['activeSession', data.couple_id], data);
    },
  });
};

// Submit answer to a session (determines user1 or user2 automatically)
export const useSubmitSessionAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CoupleSession,
    Error,
    { sessionId: string; coupleId: string; userId: string; answer: string; mood?: string }
  >({
    mutationFn: async ({ sessionId, coupleId, userId, answer, mood }) => {
      // First fetch the session to determine which user field to update
      const { data: session, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const isUser1 = session.user1_id === userId;
      const isUser2 = session.user2_id === userId;

      let updatePayload: Record<string, unknown> = {};

      if (isUser1) {
        updatePayload.user1_answer = answer;
        if (mood) updatePayload.user1_mood = mood;
      } else if (isUser2) {
        updatePayload.user2_answer = answer;
        if (mood) updatePayload.user2_mood = mood;
      } else {
        // This user is user2 (joining the session)
        updatePayload.user2_id = userId;
        updatePayload.user2_answer = answer;
        if (mood) updatePayload.user2_mood = mood;
      }

      // Check if both answers will now be present
      const bothAnswered =
        (isUser1 && session.user2_answer) ||
        (isUser2 && session.user1_answer) ||
        (!isUser1 && !isUser2 && session.user1_answer);

      if (bothAnswered) {
        updatePayload.completed = true;
        updatePayload.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('sessions')
        .update(updatePayload)
        .eq('id', sessionId)
        .select('*, cards(*)')
        .single();

      if (error) throw new Error(error.message);
      return data as CoupleSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeSession', data.couple_id] });
      if (data.completed) {
        queryClient.invalidateQueries({ queryKey: ['sessionHistory', data.couple_id] });
      }
    },
  });
};
