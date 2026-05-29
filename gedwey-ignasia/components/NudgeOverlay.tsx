import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store/authStore';
import { useUserProfile } from '../lib/queries/profile';

export default function NudgeOverlay() {
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const [nudgeSender, setNudgeSender] = useState<string | null>(null);

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!profile?.couple_id) return;

    // Listen to real-time broadcast channel for couple-specific nudges
    const channelId = `nudges:${profile.couple_id}`;
    const channel = supabase.channel(channelId);

    channel
      .on('broadcast', { event: 'nudge' }, (payload: any) => {
        console.log('[NudgeOverlay] Nudge received:', payload);
        const sender = payload.payload?.sender || 'Your Partner';
        
        // Only trigger if we are NOT the sender
        if (payload.payload?.senderId !== user?.id) {
          setNudgeSender(sender);
          triggerNudgeAnimation();
        }
      })
      .subscribe((status) => {
        console.log(`[NudgeOverlay] Realtime channel status for ${channelId}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.couple_id, user?.id]);

  const triggerNudgeAnimation = () => {
    // scale up, pulse heart, fade out
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withSpring(1.0, { damping: 10, stiffness: 100 }),
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withTiming(0, { duration: 800 })
    );
    
    // Fade out background slightly after heart pulse
    opacity.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 600 })
    );
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Render overlay only during active animation
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-0 z-[999] justify-center items-center bg-pink-500/10"
      style={[StyleSheet.absoluteFill, containerStyle]}
    >
      <View className="items-center bg-white/90 p-8 rounded-[32px] border border-pink-100 shadow-2xl">
        <Animated.View style={heartStyle}>
          <Text className="text-[120px] text-red-500">❤️</Text>
        </Animated.View>
        <Text className="text-lg font-bold text-text-primary mt-4 text-center">
          Thinking of You
        </Text>
        <Text className="text-sm text-pink-600 font-semibold mt-1 text-center capitalize">
          {nudgeSender ? `${nudgeSender} sent a warm nudge!` : 'A gentle hug sent from partner'}
        </Text>
      </View>
    </Animated.View>
  );
}
