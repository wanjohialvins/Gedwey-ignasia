import { create } from 'zustand';
import {
  getMusicPlayerState,
  pauseMusic,
  playMoodTrack,
  playUrlTrack,
  subscribeMusicPlayer,
  toggleMusicPlayback,
  stopMusic,
  type PlaybackState,
} from '../musicPlayerService';

type MusicStore = PlaybackState & {
  playMood: (moodId: string) => Promise<void>;
  playUrl: (url: string, title: string, subtitle?: string) => Promise<void>;
  toggle: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  syncFromService: () => void;
};

export const useMusicStore = create<MusicStore>((set) => ({
  ...getMusicPlayerState(),
  playMood: async (moodId) => {
    await playMoodTrack(moodId);
  },
  playUrl: async (url, title, subtitle) => {
    await playUrlTrack(url, title, subtitle);
  },
  toggle: async () => {
    await toggleMusicPlayback();
  },
  pause: async () => {
    await pauseMusic();
  },
  stop: async () => {
    await stopMusic();
  },
  syncFromService: () => set(getMusicPlayerState()),
}));

let subscribed = false;

export const initMusicStoreSync = () => {
  if (subscribed) return;
  subscribed = true;
  subscribeMusicPlayer((s) => {
    useMusicStore.setState({ ...s });
  });
};
