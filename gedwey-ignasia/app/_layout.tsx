import "../global.css";
import React, { useEffect } from 'react';
import { View, LogBox, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import "../lib/notifications";
import { useAppUpdates } from '../lib/hooks/useAppUpdates';
import { FuturisticUpdateModal } from '../components/FuturisticUpdateModal';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  '[expo-av]: Expo AV has been deprecated',
  '[Reanimated] Reduced motion setting is enabled',
  'AuthApiError: Invalid Refresh Token: Refresh Token Not Found',
]);
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store/authStore';
import { GedweyLoader } from '../components/GedweyLoader';
import { OfflineBanner } from '../components/OfflineBanner';
import { prefetchGameCards } from '../lib/queries/gameCards';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // Block rendering until the Ionicons font is loaded
  if (!fontsLoaded) {
    return null;
  }

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
  const { updateAvailable, setUpdateAvailable } = useAppUpdates();
  const [animationFinished, setAnimationFinished] = React.useState(false);

  console.log('[InitialLayout] Rendering, loading:', loading, 'session:', !!session, 'segments:', segments);

  // 1. Listen to Auth state changes
  useEffect(() => {
    console.log('[InitialLayout] Running Auth effect');
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('[InitialLayout] getSession error:', error);
          if (error.message?.includes('Refresh Token') || error.status === 400) {
            // Auto-heal by signing out invalid cached sessions
            supabase.auth.signOut().catch(() => {});
          }
        }
        console.log('[InitialLayout] getSession completed, session found:', !!session);
        setSession(session);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[InitialLayout] getSession failed:', err);
        setLoading(false);
      });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[InitialLayout] Auth state changed event:', event, 'session found:', !!session);
      setSession(session);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false);
      }
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

  useEffect(() => {
    prefetchGameCards().catch(() => {});
  }, []);

  // Loading state matching design rules (No default spinner, but since it's initial bootstrap,
  // we'll show a clean background matching design colors)
  if (loading || !animationFinished) {
    return (
      <GedweyLoader
        subtitle="connecting your session..."
        mode="determinate"
        onFinished={() => setAnimationFinished(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      {updateAvailable && (
        <FuturisticUpdateModal
          onConfirm={() => Updates.reloadAsync()}
          onCancel={() => setUpdateAvailable(false)}
        />
      )}
    </View>
  );
}
