import { Audio } from 'expo-av';
import { getSoundscape } from './soundscapes';

let ambientSound: Audio.Sound | null = null;
let currentTrackId: string | null = null;

export async function playSoundscape(trackId: string): Promise<void> {
  if (currentTrackId === trackId && ambientSound) {
    const status = await ambientSound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) return;
  }

  await stopSoundscape();

  const track = getSoundscape(trackId);
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: track.url },
    { shouldPlay: true, isLooping: true, volume: 0.35 }
  );

  ambientSound = sound;
  currentTrackId = trackId;
}

export async function stopSoundscape(): Promise<void> {
  if (ambientSound) {
    await ambientSound.stopAsync();
    await ambientSound.unloadAsync();
    ambientSound = null;
  }
  currentTrackId = null;
}

export async function isSoundscapePlaying(): Promise<boolean> {
  if (!ambientSound) return false;
  const status = await ambientSound.getStatusAsync();
  return status.isLoaded && status.isPlaying;
}

export function getCurrentSoundscapeId(): string | null {
  return currentTrackId;
}
