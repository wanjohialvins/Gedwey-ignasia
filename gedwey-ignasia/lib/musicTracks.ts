export type MoodId = 'calm' | 'playful' | 'deep' | 'nature' | 'rain' | 'ocean' | 'forest' | 'cozy' | 'wind' | 'campfire' | 'waterfall' | 'crickets';

export type MoodTrack = {
  id: MoodId;
  title: string;
  artist: string;
  url: string;
  emoji: string;
};

/** Royalty-free demo streams for in-app mood radio */
export const MOOD_TRACKS: MoodTrack[] = [
  {
    id: 'calm',
    title: 'Quiet Horizon',
    artist: 'Mood Radio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    emoji: '😌',
  },
  {
    id: 'playful',
    title: 'Bright Steps',
    artist: 'Mood Radio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    emoji: '🎵',
  },
  {
    id: 'deep',
    title: 'Midnight Pulse',
    artist: 'Mood Radio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    emoji: '🌙',
  },
  {
    id: 'nature',
    title: 'Morning Birds',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/forest-wind-1.mp3',
    emoji: '🌿',
  },
  {
    id: 'rain',
    title: 'Gentle Rain',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/rain-07.mp3',
    emoji: '🌧️',
  },
  {
    id: 'ocean',
    title: 'Ocean Waves',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3',
    emoji: '🌊',
  },
  {
    id: 'forest',
    title: 'Forest Walk',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/forest-wind-1.mp3',
    emoji: '🌲',
  },
  {
    id: 'cozy',
    title: 'Fireplace Glow',
    artist: 'Ambient',
    url: 'https://www.soundjay.com/nature/sounds/fire-1.mp3',
    emoji: '🔥',
  },
  {
    id: 'wind',
    title: 'Mountain Breeze',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/wind-soft-01.mp3',
    emoji: '🍃',
  },
  {
    id: 'campfire',
    title: 'Campfire Crackle',
    artist: 'Ambient',
    url: 'https://www.soundjay.com/nature/sounds/fire-1.mp3',
    emoji: '🏕️',
  },
  {
    id: 'waterfall',
    title: 'Distant Waterfall',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/waterfall-1.mp3',
    emoji: '💧',
  },
  {
    id: 'crickets',
    title: 'Night Crickets',
    artist: 'Nature Sounds',
    url: 'https://www.soundjay.com/nature/sounds/crickets-01.mp3',
    emoji: '🦗',
  },
];

export const getMoodTrack = (moodId: string) =>
  MOOD_TRACKS.find((t) => t.id === moodId) ?? MOOD_TRACKS[0];

export const isDirectAudioUrl = (url: string) => /\.(mp3|m4a|wav|aac|ogg)(\?|$)/i.test(url);

export const getYoutubeEmbedUrl = (url: string) => {
  const id = getYoutubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?playsinline=1`;
};

export const getYoutubeVideoId = (url: string) => {
  const match =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
};
