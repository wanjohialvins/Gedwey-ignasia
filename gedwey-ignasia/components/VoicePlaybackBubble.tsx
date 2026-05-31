import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';

type Props = {
  url?: string | null;
  duration?: number | null;
};

export const VoicePlaybackBubble = ({ url, duration }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const unload = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // ignore unload errors
      }
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      unload();
    };
  }, []);

  if (!url) return null;

  const play = async () => {
    try {
      await unload();
      setIsPlaying(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        if (status.didJustFinish) {
          unload();
        }
      });
      await sound.playAsync();
    } catch (error: unknown) {
      setIsPlaying(false);
      const message = error instanceof Error ? error.message : 'Could not play this voice note.';
      Alert.alert('Playback Failed', message);
    }
  };

  return (
    <TouchableOpacity onPress={play} className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mt-3" activeOpacity={0.8}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-primary-600">{isPlaying ? 'Playing voice note' : 'Play voice note'}</Text>
        <Text className="text-xs text-text-secondary">{duration ? `${duration}s` : ''}</Text>
      </View>
      <View className="flex-row items-end gap-1 h-7 mt-2">
        {[8, 16, 10, 22, 13, 25, 11, 18, 9, 20].map((height, index) => (
          <View key={`${height}-${index}`} className="w-2 bg-primary-600 rounded-full opacity-70" style={{ height }} />
        ))}
      </View>
    </TouchableOpacity>
  );
};
