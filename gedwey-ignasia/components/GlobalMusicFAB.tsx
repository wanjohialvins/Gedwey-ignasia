import React, { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { usePathname } from 'expo-router';
import { AppIcon } from './AppIcon';
import { NAV_ICONS } from '../lib/navigationIcons';
import { initMusicStoreSync, useMusicStore } from '../lib/store/musicStore';

export const GlobalMusicFAB = () => {
  const pathname = usePathname();
  const { title, isPlaying, isLoading, source, toggle, pause } = useMusicStore();

  useEffect(() => {
    initMusicStoreSync();
  }, []);

  const onMusicScreen = pathname === '/music' || pathname?.includes('/music');
  if (!source || onMusicScreen) return null;

  const handlePress = () => {
    if (isPlaying) pause();
    else toggle();
  };

  return (
    <View className="absolute left-4 right-4 z-50" style={{ bottom: 88 }} pointerEvents="box-none">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="flex-row items-center bg-indigo-600 rounded-2xl px-4 py-3 shadow-lg border border-indigo-400"
      >
        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <AppIcon
              name={isPlaying ? NAV_ICONS.pauseAudio : NAV_ICONS.playAudio}
              size={22}
              color="#fff"
            />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Now playing</Text>
          <Text className="text-sm font-bold text-white" numberOfLines={1}>
            {title || 'Music'}
          </Text>
        </View>
        <Text className="text-xs font-bold text-white ml-2">{isPlaying ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>
    </View>
  );
};
