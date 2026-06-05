import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text, AppState, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../lib/hooks/useTheme';
import { useUserProfile, useUpdateProfile } from '../../lib/queries/profile';
import { useAuthStore } from '../../lib/store/authStore';
import { registerForPushNotificationsAsync, scheduleDailyReminderNotification } from '../../lib/notifications';
import { syncOfflineQueue } from '../../lib/offlineQueue';
import { markOnline } from '../../lib/networkStatus';
import { GedweyLoader } from '../../components/GedweyLoader';
import { GlobalMusicFAB } from '../../components/GlobalMusicFAB';
import { initMusicStoreSync } from '../../lib/store/musicStore';
import { Audio } from 'expo-av';
import { getCachedAudioUri } from '../../lib/audioCache';
import { supabase } from '../../lib/supabase';
import { useAppUpdates } from '../../lib/hooks/useAppUpdates';

export default function AppLayout() {
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Automatically check for OTA updates via EAS Update in production
  useAppUpdates();

  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ title: string; body: string; type?: string } | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const dismissToast = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [slideAnim]);

  useEffect(() => {
    if (toast) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [toast, slideAnim, dismissToast]);

  const handleToastPress = () => {
    if (!toast) return;
    const type = toast.type;
    dismissToast();
    
    if (type === 'session_answered') {
      router.push('/session/reveal');
    } else if (type === 'capsule_ready') {
      router.push('/capsule');
    } else if (type === 'session_reminder') {
      router.push('/session/start');
    } else if (type === 'nudge') {
      router.push('/history');
    }
  };

  // Fetch user profile via React Query
  const { data: profile, isLoading, error } = useUserProfile(user?.id ?? '');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    initMusicStoreSync();
  }, []);

  // Periodic offline queue sync (every 30s) + app resume trigger
  useEffect(() => {
    const interval = setInterval(() => {
      syncOfflineQueue().catch(err => console.warn('[AppLayout] Periodic sync error:', err));
    }, 30_000);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        markOnline();
        syncOfflineQueue().catch(err => console.warn('[AppLayout] Resume sync error:', err));
      }
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, []);

  // 1. Setup notification permissions & retrieve/save push token
  useEffect(() => {
    if (!profile || !user?.id) return;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && token !== profile.expo_push_token) {
          console.log('[AppLayout] Updating profile with new push token:', token);
          await updateProfile.mutateAsync({
            id: user.id,
            expo_push_token: token,
          });
        }
        
        // Schedule local daily reminder notification at 8:00 PM (20:00) by default
        await scheduleDailyReminderNotification(20, 0);
      } catch (err) {
        console.error('[AppLayout] Push notification setup failed:', err);
      }
    };

    setupNotifications();
  }, [profile?.id, profile?.expo_push_token, user?.id]);

  // 1.5. Realtime couple event listener for foreground sync & local push emulation
  useEffect(() => {
    const coupleId = profile?.couple_id;
    if (!coupleId || !user?.id) return;

    const channelId = `couple_events:${coupleId}`;
    const channel = supabase.channel(channelId);

    channel
      .on('broadcast', { event: 'couple_event' }, async ({ payload }) => {
        console.log('[AppLayout] Realtime event received:', payload);
        if (payload.senderId === user.id) return; // Ignore our own events

        const { event, title, body } = payload;
        
        // Map of events to their React Query invalidations
        const eventInvalidations: Record<string, string[][]> = {
          session_started: [['activeSession', coupleId]],
          session_answered: [
            ['activeSession', coupleId],
            ['sessionHistory', coupleId],
            ['couple', coupleId]
          ],
          todo_updated: [['sharedItems', coupleId, 'todo']],
          bucket_updated: [['sharedItems', coupleId, 'bucket']],
          journal_created: [['journalEntries', coupleId]],
          capsule_created: [['timeCapsules', coupleId]],
          capsule_opened: [['timeCapsules', coupleId]],
          pet_cared: [['couplePet', coupleId]],
          date_created: [['importantDates', coupleId]],
          date_deleted: [['importantDates', coupleId]],
          cycle_updated: [['cycleLogs', coupleId]],
        };

        // Invalidate queries to refresh the screen data immediately
        const keysToInvalidate = eventInvalidations[event];
        if (keysToInvalidate) {
          keysToInvalidate.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });
        }

        // Schedule local notification to pop up a banner & play a sound
        if (title && body) {
          setToast({ title, body, type: event });
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                sound: true,
                data: payload,
              },
              trigger: null, // show immediately
            });
          } catch (err) {
            console.warn('[AppLayout] Failed to show foreground local notification:', err);
          }
        }
      })
      .subscribe((status) => {
        console.log(`[AppLayout] Realtime event channel status for ${channelId}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.couple_id, user?.id, queryClient]);

  // 2. Route when user taps a notification + play raindrop sound on foreground alerts
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[AppLayout] Notification tap:', data);

      if (data?.type === 'session_answered') {
        router.push('/session/reveal');
      } else if (data?.type === 'capsule_ready') {
        router.push('/capsule');
      } else if (data?.type === 'session_reminder') {
        router.push('/session/start');
      }
    });

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[AppLayout] Notification received in foreground:', notification.request.content.title);
      
      const { title, body, data } = notification.request.content;
      if (title && body) {
        setToast({ title, body, type: typeof data?.type === 'string' ? data.type : undefined });
      }

      // Play a satisfying raindrop water drop sound for foreground partner activities
      const playRaindropSound = async () => {
        try {
          const soundUrl = 'https://www.soundjay.com/misc/sounds/water-drop-1.mp3';
          const resolved = await getCachedAudioUri(soundUrl);
          
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
          
          const { sound } = await Audio.Sound.createAsync(
            { uri: resolved },
            { shouldPlay: true, volume: 1.0 }
          );
          
          // Unload asset after play ends to prevent leaks
          setTimeout(() => {
            sound.unloadAsync().catch(() => {});
          }, 3000);
        } catch (err) {
          console.warn('[AppLayout] Foreground sound play failed:', err);
        }
      };

      playRaindropSound();
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, [router]);

  useEffect(() => {
    if (isLoading || !profile) return;

    // Check if user is inside onboarding screens
    const isOnboarding = segments.includes('onboarding');

    // Onboarding is incomplete if relationship_stage is not set
    const isOnboardingIncomplete = !profile.relationship_stage;

    console.log(
      '[AppLayout] Checking status. isOnboardingIncomplete:',
      isOnboardingIncomplete,
      'isOnboardingScreen:',
      isOnboarding
    );

    if (isOnboardingIncomplete && !isOnboarding) {
      console.log('[AppLayout] Redirecting to onboarding flow');
      router.replace('/onboarding/mode-select');
    } else if (!isOnboardingIncomplete && isOnboarding) {
      console.log('[AppLayout] Onboarding complete, redirecting to home');
      router.replace('/');
    }
  }, [profile, isLoading, segments, router]);

  if (isLoading) {
    return <GedweyLoader subtitle="loading your profile..." />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
          Failed to load profile.
        </Text>
        <Text style={{ color: '#475569', fontSize: 14, textAlign: 'center' }}>{error.message}</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="games" />
        <Stack.Screen name="history" />
        <Stack.Screen name="answers" />
        <Stack.Screen name="partner" />
        <Stack.Screen name="dates" />
        <Stack.Screen name="cycle" />
        <Stack.Screen name="cat-care" />
        <Stack.Screen name="lists" />
        <Stack.Screen name="music" />
      <Stack.Screen name="onboarding/mode-select" />
      <Stack.Screen name="onboarding/stage" />
      <Stack.Screen name="onboarding/invite" />
      <Stack.Screen name="session/start" />
      <Stack.Screen name="session/deck" />
      <Stack.Screen name="session/mood" />
      <Stack.Screen name="session/card" />
      <Stack.Screen name="session/reveal" />
      <Stack.Screen name="journal/index" />
      <Stack.Screen name="journal/create" />
      <Stack.Screen name="journal/[id]" />
      <Stack.Screen name="capsule/index" />
      <Stack.Screen name="capsule/create" />
      <Stack.Screen name="capsule/[id]" />
      <Stack.Screen name="health/index" />
      <Stack.Screen name="health/checkin" />
        </Stack>
        <GlobalMusicFAB />

        {toast && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 16,
              right: 16,
              zIndex: 9999,
              transform: [{ translateY: slideAnim }],
              paddingTop: Math.max(insets.top, 12),
            }}
          >
            <Pressable
              onPress={handleToastPress}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row items-center gap-3 shadow-2xl active:opacity-95"
            >
              <View className="w-10 h-10 rounded-full bg-indigo-600/20 items-center justify-center border border-indigo-500/30">
                <Text className="text-lg">
                  {toast.type === 'nudge' ? '💖' : toast.type === 'session_answered' ? '✨' : toast.type === 'capsule_ready' ? '⏳' : '🔔'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-white mb-0.5">{toast.title}</Text>
                <Text className="text-3xs text-slate-300 leading-normal" numberOfLines={2}>{toast.body}</Text>
              </View>
              <Pressable onPress={(e) => { e.stopPropagation(); dismissToast(); }} className="px-2.5 py-1.5 rounded-lg bg-slate-800 active:bg-slate-700">
                <Text className="text-slate-300 text-[10px] font-bold">Dismiss</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ThemeProvider>
  );
}
