import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Card } from './cards';
import { sendPushNotification, broadcastCoupleEvent } from '../notifications';
import { incrementStreak } from './streak';
import { partnerWantsNotifications } from '../notificationPrefs';

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
  user1_voice_url: string | null;
  user2_voice_url: string | null;
  user1_voice_duration: number | null;
  user2_voice_duration: number | null;
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

      // Broadcast realtime couple event
      broadcastCoupleEvent(coupleId, userId, 'session_started', {
        title: 'New Session Started 🎴',
        body: 'Your partner has started a new question session!',
      }).catch((err) => console.error('[Sessions] Realtime broadcast failed:', err));

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
    { sessionId: string; coupleId: string; userId: string; answer: string; mood?: string; voiceUrl?: string; voiceDuration?: number }
  >({
    mutationFn: async ({ sessionId, coupleId, userId, answer, mood, voiceUrl, voiceDuration }) => {
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
        if (voiceUrl) updatePayload.user1_voice_url = voiceUrl;
        if (voiceDuration) updatePayload.user1_voice_duration = voiceDuration;
        if (mood) updatePayload.user1_mood = mood;
      } else if (isUser2) {
        updatePayload.user2_answer = answer;
        if (voiceUrl) updatePayload.user2_voice_url = voiceUrl;
        if (voiceDuration) updatePayload.user2_voice_duration = voiceDuration;
        if (mood) updatePayload.user2_mood = mood;
      } else {
        // This user is user2 (joining the session)
        updatePayload.user2_id = userId;
        updatePayload.user2_answer = answer;
        if (voiceUrl) updatePayload.user2_voice_url = voiceUrl;
        if (voiceDuration) updatePayload.user2_voice_duration = voiceDuration;
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

      // Trigger notification and realtime event to partner asynchronously
      try {
        const title = 'Moments';
        const body = data.completed
          ? 'Both of you have answered! Tap to reveal the answers.'
          : "Your partner has answered today's session. Your turn!";

        // Broadcast realtime couple event for foreground sync & local sound
        broadcastCoupleEvent(coupleId, userId, 'session_answered', {
          title,
          body,
          sessionId: data.id,
        }).catch((err) => console.error('[Sessions] Realtime broadcast failed:', err));

        const { data: myProfile } = await supabase
          .from('profiles')
          .select('partner_id')
          .eq('id', userId)
          .maybeSingle();

        const partnerId = myProfile?.partner_id;
        if (partnerId) {
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('expo_push_token, preferences')
            .eq('id', partnerId)
            .maybeSingle();

          if (partnerProfile?.expo_push_token && partnerWantsNotifications(partnerProfile)) {
            const partnerToken = partnerProfile.expo_push_token;

            sendPushNotification(partnerToken, title, body, {
              type: 'session_answered',
              sessionId: data.id,
            });
          }
        }
      } catch (notificationError) {
        console.error('[Notifications] Failed to send answer notification:', notificationError);
      }

      return data as CoupleSession;

    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeSession', data.couple_id] });
      if (data.completed) {
        queryClient.invalidateQueries({ queryKey: ['sessionHistory', data.couple_id] });
        incrementStreak(data.couple_id).then(() => {
          queryClient.invalidateQueries({ queryKey: ['couple', data.couple_id] });
        });
      }
    },
  });
};

// Fetch the deterministic card of the day for a couple that they haven't answered yet
export const useDailyQuestion = (coupleId: string) => {
  return useQuery<Card | null, Error>({
    queryKey: ['dailyQuestion', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;

      // 1. Get all session card IDs for the couple (already answered/started)
      const { data: sessions, error: sessionErr } = await supabase
        .from('sessions')
        .select('card_id')
        .eq('couple_id', coupleId);

      if (sessionErr) throw new Error(sessionErr.message);
      const answeredCardIds = (sessions || []).map((s) => s.card_id);

      // 2. Fetch all cards
      const { data: cards, error: cardsErr } = await supabase
        .from('cards')
        .select('*');

      if (cardsErr) throw new Error(cardsErr.message);
      if (!cards || cards.length === 0) return null;

      // 3. Filter out cards that are already answered
      const unanswered = cards.filter((c) => !answeredCardIds.includes(c.id));
      const pool = unanswered.length > 0 ? unanswered : cards; // fallback to all if all are answered

      // Sort by ID to ensure order stability across devices/partners
      pool.sort((a, b) => a.id.localeCompare(b.id));

      // 4. Select based on current Date (UTC days since an epoch)
      const now = new Date();
      const epoch = new Date('2024-01-01T00:00:00Z');
      const diffMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - epoch.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const cardIndex = days % pool.length;
      return pool[cardIndex] as Card;
    },
    enabled: !!coupleId,
  });
};
