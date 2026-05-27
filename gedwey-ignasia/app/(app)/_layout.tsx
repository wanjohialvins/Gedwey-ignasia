import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useUserProfile, useUpdateProfile } from '../../lib/queries/profile';
import { useAuthStore } from '../../lib/store/authStore';
import { registerForPushNotificationsAsync } from '../../lib/notifications';

export default function AppLayout() {
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Fetch user profile via React Query
  const { data: profile, isLoading, error } = useUserProfile(user?.id ?? '');
  const updateProfile = useUpdateProfile();

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

  // 2. Add listener to route when user interacts with/taps a notification
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[AppLayout] Notification response received:', data);

      if (data?.type === 'session_answered') {
        router.push('/session/reveal');
      } else if (data?.type === 'capsule_ready') {
        router.push('/capsule');
      }
    });

    return () => {
      subscription.remove();
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
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#2563EB', fontSize: 16, fontWeight: '600' }}>Loading profile...</Text>
      </View>
    );
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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
  );
}
