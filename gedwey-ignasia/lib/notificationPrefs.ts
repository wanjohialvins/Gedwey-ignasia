import type { Profile } from './queries/profile';

export type UserPreferences = {
  sessionNotif?: boolean;
  partnerNotif?: boolean;
  capsuleNotif?: boolean;
  soundscapeEnabled?: boolean;
  selectedSound?: string;
};

export const getUserPreferences = (profile?: Profile | null): UserPreferences => {
  if (!profile?.preferences || typeof profile.preferences !== 'object') {
    return {
      sessionNotif: true,
      partnerNotif: true,
      capsuleNotif: true,
      soundscapeEnabled: false,
      selectedSound: 'acoustic',
    };
  }
  const prefs = profile.preferences as UserPreferences;
  return {
    sessionNotif: prefs.sessionNotif !== false,
    partnerNotif: prefs.partnerNotif !== false,
    capsuleNotif: prefs.capsuleNotif !== false,
    soundscapeEnabled: !!prefs.soundscapeEnabled,
    selectedSound: prefs.selectedSound || 'acoustic',
  };
};

export const partnerWantsNotifications = (profile?: { preferences?: Record<string, unknown> | null } | null) =>
  getUserPreferences(profile as Profile).partnerNotif;

export const userWantsSessionReminders = (profile?: { preferences?: Record<string, unknown> | null } | null) =>
  getUserPreferences(profile as Profile).sessionNotif;

export const userWantsCapsuleNotifications = (profile?: { preferences?: Record<string, unknown> | null } | null) =>
  getUserPreferences(profile as Profile).capsuleNotif;
