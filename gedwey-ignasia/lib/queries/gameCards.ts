import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { CACHE_KEYS, getCache, setCache } from '../offlineCache';
import { FALLBACK_GAME_CARDS, countGameCardsByMode, filterGameCards } from '../gameFallback';
import { markOffline, markOnline, isNetworkError } from '../networkStatus';
import type { GameCategory, GameMode } from '../gamePrompts';

export type GameCard = {
  id: string;
  game_type: GameMode;
  category: GameCategory;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  is_dare: boolean;
  age_gate: boolean;
};

const PAGE_SIZE = 1000;

async function fetchAllGameCardsFromSupabase(): Promise<GameCard[]> {
  const all: GameCard[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('game_cards')
      .select('id, game_type, category, prompt, option_a, option_b, is_dare, age_gate')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const batch = (data || []) as GameCard[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

async function loadGameCardsPool(): Promise<{ cards: GameCard[]; source: 'remote' | 'cache' | 'fallback' }> {
  try {
    const remote = await fetchAllGameCardsFromSupabase();
    if (remote.length > 0) {
      await setCache(CACHE_KEYS.gameCardsAll, remote);
      markOnline();
      return { cards: remote, source: 'remote' };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isNetworkError(message)) markOffline();
  }

  const cached = await getCache<GameCard[]>(CACHE_KEYS.gameCardsAll);
  if (cached?.length) {
    return { cards: cached, source: 'cache' };
  }

  return { cards: FALLBACK_GAME_CARDS, source: 'fallback' };
}

export const useGameCards = (
  mode: GameMode,
  category: 'all' | GameCategory,
  options?: { matureEnabled?: boolean; matureConfirmed?: boolean; truthOrDareChoice?: 'truth' | 'dare' | 'any' }
) => {
  const { matureEnabled = false, matureConfirmed = false, truthOrDareChoice = 'any' } = options ?? {};

  return useQuery<GameCard[], Error>({
    queryKey: ['gameCards', mode, category, matureEnabled, matureConfirmed, truthOrDareChoice],
    queryFn: async () => {
      const { cards } = await loadGameCardsPool();
      return filterGameCards(cards, mode, category, { matureEnabled, matureConfirmed, truthOrDareChoice });
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
};

export const useGameCardCounts = () => {
  return useQuery<Record<GameMode, number>, Error>({
    queryKey: ['gameCardCounts'],
    queryFn: async () => {
      const { cards } = await loadGameCardsPool();
      return countGameCardsByMode(cards);
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
};

export type GameCardsSource = 'remote' | 'cache' | 'fallback';

export const prefetchGameCards = () => loadGameCardsPool();
