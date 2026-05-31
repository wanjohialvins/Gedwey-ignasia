import { create } from 'zustand';
import { syncOfflineQueue } from './offlineQueue';

type NetworkState = {
  isOnline: boolean;
  lastChecked: number | null;
  setOnline: (online: boolean) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  lastChecked: null,
  setOnline: (online) => set({ isOnline: online, lastChecked: Date.now() }),
}));

export const markOnline = () => {
  const wasOffline = !useNetworkStore.getState().isOnline;
  useNetworkStore.getState().setOnline(true);
  if (wasOffline) {
    console.log('[networkStatus] Network transitioned online. Triggering sync.');
    syncOfflineQueue().catch(err => console.error('[networkStatus] Queue sync error:', err));
  }
};

export const markOffline = () => useNetworkStore.getState().setOnline(false);

export const isNetworkError = (message: string) =>
  /network|fetch|failed|timeout|offline|connection|internet/i.test(message);

