import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@gedwey/cache:';

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // ignore
  }
}

export const CACHE_KEYS = {
  gameCardsAll: 'game_cards:all',
  sessionCards: (category?: string) => `session_cards:${category ?? 'all'}`,
  profile: (userId: string) => `profile:${userId}`,
  sharedItems: (coupleId: string, itemType: string) => `shared_items:${coupleId}:${itemType}`,
} as const;
