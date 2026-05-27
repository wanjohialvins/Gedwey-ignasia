import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store/authStore';
import { View, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <InitialLayout />
    </QueryClientProvider>
  );
}

function InitialLayout() {
  const { session, loading, setSession, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Listen to Auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setLoading]);

  // 2. Control navigation flow based on Auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to sign-in if not logged in
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      // Redirect to main app if logged in and trying to access auth screens
      router.replace('/(app)');
    }
  }, [session, loading, segments, router]);

  // Loading state matching design rules (No default spinner, but since it's initial bootstrap,
  // we'll show a clean background matching design colors)
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
        {/* We will build a shimmer/skeleton later, but for boot we show a clean container */}
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
