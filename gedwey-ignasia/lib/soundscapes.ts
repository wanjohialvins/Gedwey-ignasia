export type SoundscapeId = 'acoustic' | 'rain' | 'fireplace';

export type SoundscapeTrack = {
  id: SoundscapeId;
  name: string;
  url: string;
};

/** Royalty-free ambient loops for reflective writing sessions */
export const SOUNDSCAPE_TRACKS: SoundscapeTrack[] = [
  {
    id: 'acoustic',
    name: 'Lo-fi Guitar',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
  {
    id: 'rain',
    name: 'Summer Rain',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  },
  {
    id: 'fireplace',
    name: 'Cozy Crackle',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  },
];

export const getSoundscape = (id: string) =>
  SOUNDSCAPE_TRACKS.find((t) => t.id === id) ?? SOUNDSCAPE_TRACKS[0];
