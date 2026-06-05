import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { GameMode, GameCategory } from '../gamePrompts';
import { incrementStreak } from './streak';
import { formatMediumDate } from '../dateUtils';

export type GameAnswer = {
  id: string;
  created_at: string;
  couple_id: string;
  user_id: string;
  game_type: GameMode;
  category: string;
  prompt: string;
  answer_text: string;
  option_chosen: string | null;
  game_card_id: string | null;
  profiles?: { display_name: string | null; avatar_url?: string | null };
};

export const useAnswersForPrompt = (coupleId: string, promptText: string, cardId?: string) => {
  return useQuery<GameAnswer[], Error>({
    queryKey: ['gameAnswers', coupleId, promptText, cardId],
    queryFn: async () => {
      if (!coupleId || !promptText) return [];
      let query = supabase
        .from('game_answers')
        .select('*, profiles(display_name, avatar_url)')
        .eq('couple_id', coupleId)
        .eq('prompt', promptText)
        .order('created_at', { ascending: true });

      if (cardId) query = query.eq('game_card_id', cardId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        answer_text: (row.answer_text as string) || (row.answer as string) || '',
      })) as GameAnswer[];
    },
    enabled: !!coupleId && !!promptText,
  });
};

export const useGameAnswers = (coupleId: string) => {
  return useQuery<GameAnswer[], Error>({
    queryKey: ['gameAnswersAll', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('game_answers')
        .select('*, profiles(display_name, avatar_url)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        answer_text: (row.answer_text as string) || (row.answer as string) || '',
      })) as GameAnswer[];
    },
    enabled: !!coupleId,
  });
};

export const useSubmitGameAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    GameAnswer,
    Error,
    {
      coupleId: string;
      userId: string;
      gameCardId: string;
      gameType: GameMode;
      category: string;
      promptText: string;
      answerText: string;
      optionChosen?: string;
    }
  >({
    mutationFn: async ({ coupleId, userId, gameCardId, gameType, category, promptText, answerText, optionChosen }) => {
      const { data: existing } = await supabase
        .from('game_answers')
        .select('id')
        .eq('couple_id', coupleId)
        .eq('user_id', userId)
        .eq('game_card_id', gameCardId)
        .maybeSingle();

      const payload = {
        couple_id: coupleId,
        user_id: userId,
        game_type: gameType,
        category,
        prompt: promptText,
        answer: answerText,
        answer_text: answerText,
        option_chosen: optionChosen ?? null,
        game_card_id: gameCardId,
      };

      let result;
      if (existing?.id) {
        const { data, error } = await supabase
          .from('game_answers')
          .update(payload)
          .eq('id', existing.id)
          .select('*, profiles(display_name, avatar_url)')
          .single();
        if (error) throw new Error(error.message);
        result = data;
      } else {
        const { data, error } = await supabase
          .from('game_answers')
          .insert(payload)
          .select('*, profiles(display_name, avatar_url)')
          .single();
        if (error) throw new Error(error.message);
        result = data;
      }

      await incrementStreak(coupleId);
      return { ...result, answer_text: answerText } as GameAnswer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gameAnswers', data.couple_id] });
      queryClient.invalidateQueries({ queryKey: ['gameAnswersAll', data.couple_id] });
      queryClient.invalidateQueries({ queryKey: ['couple', data.couple_id] });
    },
  });
};

export type SessionAnswerEntry = {
  id: string;
  created_at: string;
  completed_at: string | null;
  user1_id: string;
  user2_id: string | null;
  user1_answer: string | null;
  user2_answer: string | null;
  user1_mood: string | null;
  user2_mood: string | null;
  category: string;
  prompt: string;
};

export const useAllCoupleAnswers = (coupleId: string) => {
  const gameAnswers = useGameAnswers(coupleId);

  const sessionAnswers = useQuery<SessionAnswerEntry[], Error>({
    queryKey: ['allSessionAnswers', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('id, created_at, completed_at, user1_id, user2_id, user1_answer, user2_answer, user1_mood, user2_mood, cards(text, category)')
        .eq('couple_id', coupleId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);

      return (data || []).map((s: Record<string, unknown>) => {
        const cards = s.cards as { text?: string; category?: string } | null;
        return {
          id: s.id as string,
          created_at: s.created_at as string,
          completed_at: s.completed_at as string | null,
          user1_id: s.user1_id as string,
          user2_id: s.user2_id as string | null,
          user1_answer: s.user1_answer as string | null,
          user2_answer: s.user2_answer as string | null,
          user1_mood: s.user1_mood as string | null,
          user2_mood: s.user2_mood as string | null,
          category: cards?.category || 'session',
          prompt: cards?.text || 'Session question',
        };
      });
    },
    enabled: !!coupleId,
  });

  return { gameAnswers, sessionAnswers };
};

export type GroupedAnswer = {
  day: string;
  items: Array<{
    id: string;
    source: 'game' | 'session';
    category: string;
    prompt: string;
    answers: Array<{ userId: string; name: string; answer: string; mood?: string | null }>;
    createdAt: string;
  }>;
};

export const groupAnswersByDay = (
  gameAnswers: GameAnswer[],
  sessionAnswers: SessionAnswerEntry[],
  myId: string,
  myName: string,
  partnerName: string
): GroupedAnswer[] => {
  const map = new Map<string, GroupedAnswer['items']>();

  const dayKey = (iso: string) => {
    return formatMediumDate(iso);
  };

  gameAnswers.forEach((ga) => {
    const day = dayKey(ga.created_at);
    const list = map.get(day) || [];
    list.push({
      id: ga.id,
      source: 'game',
      category: ga.category,
      prompt: ga.prompt,
      createdAt: ga.created_at,
      answers: [
        {
          userId: ga.user_id,
          name: ga.profiles?.display_name || (ga.user_id === myId ? myName : partnerName),
          answer: ga.answer_text,
        },
      ],
    });
    map.set(day, list);
  });

  sessionAnswers.forEach((sa) => {
    const day = dayKey(sa.completed_at || sa.created_at);
    const list = map.get(day) || [];
    const answers: GroupedAnswer['items'][0]['answers'] = [];
    if (sa.user1_answer) {
      answers.push({
        userId: sa.user1_id,
        name: sa.user1_id === myId ? myName : partnerName,
        answer: sa.user1_answer,
        mood: sa.user1_mood,
      });
    }
    if (sa.user2_answer) {
      answers.push({
        userId: sa.user2_id || '',
        name: sa.user2_id === myId ? myName : partnerName,
        answer: sa.user2_answer,
        mood: sa.user2_mood,
      });
    }
    list.push({
      id: sa.id,
      source: 'session',
      category: sa.category,
      prompt: sa.prompt,
      createdAt: sa.completed_at || sa.created_at,
      answers,
    });
    map.set(day, list);
  });

  return Array.from(map.entries())
    .map(([day, items]) => ({
      day,
      items: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }))
    .sort((a, b) => {
      const tA = a.items[0]?.createdAt ? new Date(a.items[0].createdAt).getTime() : 0;
      const tB = b.items[0]?.createdAt ? new Date(b.items[0].createdAt).getTime() : 0;
      return tB - tA;
    });
};

// ── Pending Items (partner answered, I have not) ─────────────────────────────

export type PendingSession = {
  id: string;
  created_at: string;
  card_id: string;
  prompt: string;
  category: string;
  partnerAnsweredAt: string;
};

/** Sessions where the couple partner has answered but the current user has not yet. */
export const usePendingSessionsForMe = (coupleId: string, myId: string) => {
  return useQuery<PendingSession[], Error>({
    queryKey: ['pendingSessions', coupleId, myId],
    queryFn: async () => {
      if (!coupleId || !myId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('id, created_at, card_id, user1_id, user2_id, user1_answer, user2_answer, cards(text, category)')
        .eq('couple_id', coupleId)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);

      return (data || [])
        .filter((s: Record<string, unknown>) => {
          const isUser1 = s.user1_id === myId;
          const isUser2 = s.user2_id === myId;
          // Partner started it and answered, I haven't joined/answered
          const partnerStartedIHaventJoined = !isUser1 && !isUser2 && !!s.user1_answer;
          // I'm user1 but haven't answered yet AND partner (user2) already has
          const imUser1NotAnswered = isUser1 && !s.user1_answer && !!s.user2_answer;
          // I'm user2 but haven't answered yet AND user1 already has
          const imUser2NotAnswered = isUser2 && !s.user2_answer && !!s.user1_answer;
          return partnerStartedIHaventJoined || imUser1NotAnswered || imUser2NotAnswered;
        })
        .map((s: Record<string, unknown>) => {
          const card = s.cards as { text?: string; category?: string } | null;
          return {
            id: s.id as string,
            created_at: s.created_at as string,
            card_id: s.card_id as string,
            prompt: card?.text || 'Session question',
            category: card?.category || 'session',
            partnerAnsweredAt: s.created_at as string,
          };
        });
    },
    enabled: !!coupleId && !!myId,
    refetchInterval: 10000,
  });
};

export type PendingGamePrompt = {
  gameCardId: string;
  prompt: string;
  category: string;
  gameType: GameMode;
  partnerAnswerId: string;
  partnerAnsweredAt: string;
};

/** Game prompts where the partner has answered but the current user has not. */
export const usePendingGamePromptsForMe = (coupleId: string, myId: string) => {
  return useQuery<PendingGamePrompt[], Error>({
    queryKey: ['pendingGamePrompts', coupleId, myId],
    queryFn: async () => {
      if (!coupleId || !myId) return [];

      // Fetch all game answers for this couple
      const { data, error } = await supabase
        .from('game_answers')
        .select('id, created_at, user_id, game_card_id, game_type, category, prompt')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);
      const rows = (data || []) as {
        id: string;
        created_at: string;
        user_id: string;
        game_card_id: string | null;
        game_type: GameMode;
        category: string;
        prompt: string;
      }[];

      // Group by game_card_id
      const byCard = new Map<string, typeof rows>();
      rows.forEach((row) => {
        if (!row.game_card_id) return;
        const list = byCard.get(row.game_card_id) || [];
        list.push(row);
        byCard.set(row.game_card_id, list);
      });

      const pending: PendingGamePrompt[] = [];
      byCard.forEach((answers, cardId) => {
        const myAnswer = answers.find((a) => a.user_id === myId);
        const partnerAnswer = answers.find((a) => a.user_id !== myId);
        if (!myAnswer && partnerAnswer) {
          pending.push({
            gameCardId: cardId,
            prompt: partnerAnswer.prompt,
            category: partnerAnswer.category,
            gameType: partnerAnswer.game_type,
            partnerAnswerId: partnerAnswer.id,
            partnerAnsweredAt: partnerAnswer.created_at,
          });
        }
      });

      return pending.sort(
        (a, b) => new Date(b.partnerAnsweredAt).getTime() - new Date(a.partnerAnsweredAt).getTime()
      );
    },
    enabled: !!coupleId && !!myId,
    refetchInterval: 10000,
  });
};
