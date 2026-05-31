import { Audio } from 'expo-av';
import { getMoodTrack, getYoutubeEmbedUrl, getYoutubeVideoId, isDirectAudioUrl } from './musicTracks';
import { getCachedAudioUri } from './audioCache';

export type PlaybackSource = 'mood' | 'url' | 'youtube';

export type PlaybackState = {
  isPlaying: boolean;
  isLoading: boolean;
  title: string;
  subtitle: string;
  source: PlaybackSource | null;
  moodId: string | null;
  url: string | null;
  youtubeEmbedUrl: string | null;
};

type Listener = (state: PlaybackState) => void;

const initialState: PlaybackState = {
  isPlaying: false,
  isLoading: false,
  title: '',
  subtitle: '',
  source: null,
  moodId: null,
  url: null,
  youtubeEmbedUrl: null,
};

let sound: Audio.Sound | null = null;
let state: PlaybackState = { ...initialState };
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((fn) => fn({ ...state }));
};

const setState = (patch: Partial<PlaybackState>) => {
  state = { ...state, ...patch };
  notify();
};

export const subscribeMusicPlayer = (listener: Listener) => {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
};

export const getMusicPlayerState = () => ({ ...state });

const unloadSound = async () => {
  if (sound) {
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
    sound = null;
  }
};

const playAudioUri = async (uri: string, title: string, subtitle: string, meta: Partial<PlaybackState>) => {
  setState({ isLoading: true, youtubeEmbedUrl: null, ...meta, title, subtitle });
  try {
    await unloadSound();
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    
    // Resolve locally cached path if downloaded
    const resolvedUri = await getCachedAudioUri(uri);
    
    const { sound: next } = await Audio.Sound.createAsync({ uri: resolvedUri }, { shouldPlay: true }, (status) => {
      if (!status.isLoaded) return;
      setState({ isPlaying: status.isPlaying });
      if (status.didJustFinish) {
        setState({ isPlaying: false });
      }
    });
    sound = next;
    setState({ isPlaying: true, isLoading: false });
  } catch (err) {
    setState({ isLoading: false, isPlaying: false });
    throw err;
  }
};

export const playMoodTrack = async (moodId: string) => {
  const track = getMoodTrack(moodId);
  await playAudioUri(track.url, track.title, track.artist, {
    source: 'mood',
    moodId,
    url: track.url,
  });
};

export const playUrlTrack = async (url: string, title: string, subtitle = 'Custom track') => {
  const trimmed = url.trim();
  if (!trimmed) throw new Error('No URL to play');

  const videoId = getYoutubeVideoId(trimmed);
  if (videoId) {
    await unloadSound();
    setState({
      isLoading: false,
      isPlaying: true,
      source: 'youtube',
      moodId: null,
      url: trimmed,
      youtubeEmbedUrl: getYoutubeEmbedUrl(trimmed),
      title,
      subtitle,
    });
    return;
  }

  if (!isDirectAudioUrl(trimmed)) {
    throw new Error('Use a direct .mp3 link or YouTube URL');
  }

  await playAudioUri(trimmed, title, subtitle, {
    source: 'url',
    moodId: null,
    url: trimmed,
  });
};

export const toggleMusicPlayback = async () => {
  if (state.source === 'youtube') {
    setState({ isPlaying: !state.isPlaying });
    return;
  }
  if (!sound) {
    if (state.moodId) await playMoodTrack(state.moodId);
    else if (state.url) await playUrlTrack(state.url, state.title, state.subtitle);
    return;
  }
  const status = await sound.getStatusAsync();
  if (!status.isLoaded) return;
  if (status.isPlaying) {
    await sound.pauseAsync();
    setState({ isPlaying: false });
  } else {
    await sound.playAsync();
    setState({ isPlaying: true });
  }
};

export const pauseMusic = async () => {
  if (state.source === 'youtube') {
    setState({ isPlaying: false });
    return;
  }
  if (sound) {
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    }
  }
  setState({ isPlaying: false });
};

export const stopMusic = async () => {
  await unloadSound();
  state = { ...initialState };
  notify();
};
