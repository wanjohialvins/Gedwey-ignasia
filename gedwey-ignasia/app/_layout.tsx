import "../global.css";
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store/authStore';
import { View, Text } from 'react-native';

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

  console.log('[InitialLayout] Rendering, loading:', loading, 'session:', !!session, 'segments:', segments);

  // 1. Listen to Auth state changes
  useEffect(() => {
    console.log('[InitialLayout] Running Auth effect');
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[InitialLayout] getSession completed, session found:', !!session);
        setSession(session);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[InitialLayout] getSession failed:', err);
        setLoading(false);
      });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[InitialLayout] Auth state changed event:', _event, 'session found:', !!session);
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setLoading]);

  // 2. Control navigation flow based on Auth state
  useEffect(() => {
    console.log('[InitialLayout] Navigation effect, loading:', loading, 'session:', !!session, 'segments:', segments);
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDiscoveryGroup = segments.includes('discovery');
    console.log('[InitialLayout] Checking route redirect. inAuthGroup:', inAuthGroup, 'inDiscoveryGroup:', inDiscoveryGroup);

    if (!session && !inAuthGroup && !inDiscoveryGroup) {
      console.log('[InitialLayout] Redirecting to /(auth)/sign-in');
      // Redirect to sign-in if not logged in and not in public groups
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      console.log('[InitialLayout] Redirecting to /(app)');
      // Redirect to main app if logged in and trying to access auth screens
      router.replace('/(app)');
    }
  }, [session, loading, segments, router]);

  // Loading state matching design rules (No default spinner, but since it's initial bootstrap,
  // we'll show a clean background matching design colors)
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#2563EB', fontSize: 16, fontWeight: '600' }}>Connecting to Moments...</Text>
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
