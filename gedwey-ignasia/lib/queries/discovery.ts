import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Card } from './cards';
import { sendPushNotification } from '../notifications';

export interface DiscoverySession {
  id: string;
  created_at: string;
  card_id: string;
  creator_id: string;
  creator_answer: string;
  guest_name: string | null;
  guest_answer: string | null;
  token: string;
  completed_at: string | null;
  cards?: Card; // Nested card relationship from Supabase
}

// Fetch discovery session by share token (accessible by guest/public)
export const useDiscoverySessionByToken = (token: string) => {
  return useQuery<DiscoverySession | null, Error>({
    queryKey: ['discoverySession', token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from('discovery_sessions')
        .select('*, cards(*)')
        .eq('token', token)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      return data as DiscoverySession | null;
    },
    enabled: !!token,
  });
};

// Create a new discovery session
export const useCreateDiscoverySession = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DiscoverySession,
    Error,
    { cardId: string; creatorId: string; creatorAnswer: string; token: string }
  >({
    mutationFn: async ({ cardId, creatorId, creatorAnswer, token }) => {
      const { data, error } = await supabase
        .from('discovery_sessions')
        .insert({
          card_id: cardId,
          creator_id: creatorId,
          creator_answer: creatorAnswer,
          token: token,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as DiscoverySession;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['discoverySession', data.token], data);
    },
  });
};

// Submit guest response
export const useSubmitGuestAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DiscoverySession,
    Error,
    { token: string; guestName: string; guestAnswer: string }
  >({
    mutationFn: async ({ token, guestName, guestAnswer }) => {
      const { data, error } = await supabase
        .from('discovery_sessions')
        .update({
          guest_name: guestName,
          guest_answer: guestAnswer,
          completed_at: new Date().toISOString(),
        })
        .eq('token', token)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Trigger notification to the discovery creator asynchronously
      try {
        const creatorId = data.creator_id;
        if (creatorId) {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('expo_push_token')
            .eq('id', creatorId)
            .maybeSingle();

          if (creatorProfile?.expo_push_token) {
            const creatorToken = creatorProfile.expo_push_token;
            const title = 'Moments';
            const body = `${guestName} answered your discovery card! Tap to read.`;

            sendPushNotification(creatorToken, title, body, {
              type: 'session_answered',
            });
          }
        }
      } catch (notificationError) {
        console.error('[Notifications] Failed to send guest answer notification:', notificationError);
      }

      return data as DiscoverySession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discoverySession', data.token] });
    },
  });
};
