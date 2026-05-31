import { useEffect } from 'react';
import type { Profile } from '../queries/profile';
import { getUserPreferences } from '../notificationPrefs';
import { playSoundscape, stopSoundscape } from '../soundscapePlayer';

/** Starts ambient loop on mount when profile preferences allow; stops on unmount. */
export function useSessionSoundscape(profile?: Profile | null) {
  useEffect(() => {
    const prefs = getUserPreferences(profile);
    if (!prefs.soundscapeEnabled) return;

    playSoundscape(prefs.selectedSound || 'acoustic').catch(() => {});

    return () => {
      stopSoundscape().catch(() => {});
    };
  }, [profile?.id, profile?.preferences]);
}
