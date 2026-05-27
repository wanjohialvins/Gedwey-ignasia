import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import { useUserProfile } from '../../lib/queries/profile';
import { useAuthStore } from '../../lib/store/authStore';

export default function AppLayout() {
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Fetch user profile via React Query
  const { data: profile, isLoading, error } = useUserProfile(user?.id ?? '');

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
    </Stack>
  );
}
