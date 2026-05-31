import { create } from 'zustand';

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

export const markOnline = () => useNetworkStore.getState().setOnline(true);
export const markOffline = () => useNetworkStore.getState().setOnline(false);

export const isNetworkError = (message: string) =>
  /network|fetch|failed|timeout|offline|connection|internet/i.test(message);
