import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '../../lib/hooks/useTheme';
import { useUserProfile, useUpdateProfile } from '../../lib/queries/profile';
import { useAuthStore } from '../../lib/store/authStore';
import { registerForPushNotificationsAsync } from '../../lib/notifications';
import { GedweyLoader } from '../../components/GedweyLoader';
import { GlobalMusicFAB } from '../../components/GlobalMusicFAB';
import { initMusicStoreSync } from '../../lib/store/musicStore';

export default function AppLayout() {
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Fetch user profile via React Query
  const { data: profile, isLoading, error } = useUserProfile(user?.id ?? '');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    initMusicStoreSync();
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
      } catch (err) {
        console.error('[AppLayout] Push notification setup failed:', err);
      }
    };

    setupNotifications();
  }, [profile?.id, profile?.expo_push_token, user?.id]);

  // 2. Route when user taps a notification
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
      </View>
    </ThemeProvider>
  );
}
