import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export const FuturisticUpdateModal = ({ onConfirm, onCancel }: Props) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, pulseAnim]);

  return (
    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Futuristic Glowing Pulse Header */}
        <View className="items-center mb-5">
          <Animated.View 
            style={[styles.glowRing, { opacity: pulseAnim }]} 
            className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-400 items-center justify-center mb-3"
          >
            <Text className="text-2xl">⚡</Text>
          </Animated.View>
          <Text className="text-xs font-black tracking-widest text-indigo-400 uppercase">System Sync Required</Text>
          <Text className="text-xl font-bold text-white mt-1">Update Core Matrix</Text>
        </View>

        {/* HUD Details */}
        <View className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mb-6">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-4xs font-bold text-slate-500 uppercase tracking-widest">Protocol</Text>
            <Text className="text-4xs font-bold text-indigo-300 uppercase tracking-widest">OTA_PUSH_SYNC</Text>
          </View>
          <Text className="text-2xs text-slate-400 leading-normal">
            A new JS update is ready. Sync the core engine to activate hot-patches and relationship modules.
          </Text>
        </View>

        {/* Futuristic Glowing Actions */}
        <View className="gap-3 w-full">
          <TouchableOpacity
            onPress={onConfirm}
            className="bg-indigo-600 rounded-xl py-3.5 items-center justify-center border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] active:bg-indigo-500"
            activeOpacity={0.85}
          >
            <Text className="text-white text-xs font-black tracking-widest uppercase">Reboot System</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCancel}
            className="border border-slate-700 bg-slate-800/40 rounded-xl py-3.5 items-center justify-center active:bg-slate-800"
            activeOpacity={0.85}
          >
            <Text className="text-slate-400 text-xs font-black tracking-widest uppercase">Bypass</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  glowRing: {
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
});
