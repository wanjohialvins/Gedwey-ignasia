import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useJournalEntry } from '../../../lib/queries/journal';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { formatLongDate } from '../../../lib/dateUtils';

export default function JournalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: entry, isLoading, error } = useJournalEntry(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
          
          <View className="pt-2.5 mb-4">
            <Skeleton width="80%" height={28} className="mb-3" />
            <View className="flex-row justify-between">
              <Skeleton width={140} height={14} />
              <Skeleton width={100} height={14} />
            </View>
          </View>
          <View className="h-[1px] bg-slate-200 w-full mb-5" />

          <View className="gap-2.5">
            <Skeleton width="95%" height={16} />
            <Skeleton width="98%" height={16} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="40%" height={16} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !entry) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
            <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1 justify-center items-center px-6 pb-12">
            <Text className="text-5xl mb-4">⚠️</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">Failed to load memory</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
              {error?.message || 'The requested journal entry could not be found.'}
            </Text>
            <Button
              title="Back to Journal"
              onPress={() => router.replace('/journal')}
              className="w-full"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = formatLongDate(entry?.created_at);

  const rawProfiles = entry?.profiles;
  const profilesObj = Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles;
  const creatorName = profilesObj?.display_name || 'Partner';

  // Parse mock voice note metadata
  const voiceMatch = entry?.content ? entry.content.match(/\[voice:(\d+:\d+)\]/) : null;
  const displayContent = entry?.content ? entry.content.replace(/\[voice:\d+:\d+\]/g, '').trim() : '';

  // Deterministic random rotation based on entry ID hash
  const getRotationAngle = (idStr?: string) => {
    if (!idStr) return '0deg';
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const angle = (hash % 4) - 2; // Returns -2, -1, 0, or 1
    return `${angle}deg`;
  };

  // Mock voice note player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [timerText, setTimerText] = useState('00:00');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && voiceMatch) {
      const [maxMin, maxSec] = voiceMatch[1].split(':').map(Number);
      const totalSeconds = maxMin * 60 + maxSec;
      
      interval = setInterval(() => {
        setPlayProgress((prev: number) => {
          const next = prev + (1 / totalSeconds);
          if (next >= 1) {
            setIsPlaying(false);
            setTimerText(`00:${maxSec < 10 ? '0' : ''}${maxSec}`);
            return 1;
          }
          const currentSeconds = Math.floor(next * totalSeconds);
          setTimerText(`00:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, voiceMatch]);

  const handlePlayToggle = () => {
    if (!isPlaying && playProgress >= 1) {
      setPlayProgress(0);
      setTimerText('00:00');
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
          <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header section */}
          <View className="pt-2.5 mb-4">
            <Text className="text-2xl font-bold text-text-primary mb-3 leading-normal">{entry?.title || 'Untitled Memory'}</Text>
            <View className="flex-row justify-between items-center flex-wrap gap-2">
              <Text className="text-xs font-semibold text-primary-600">{formattedDate}</Text>
              <Text className="text-xs text-text-muted font-medium">Written by {creatorName}</Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-slate-200 w-full mb-5" />

          {/* Polaroid Scrapbook Grid Section */}
          {entry?.image_url && (
            <View className="items-center mb-6">
              <View 
                style={{ 
                  transform: [{ rotate: getRotationAngle(entry?.id) }] 
                }}
                className="bg-white border border-slate-200 p-3 pb-10 shadow-lg rounded-sm w-[90%] max-w-[320px]"
              >
                <View className="w-full h-64 bg-slate-100 overflow-hidden rounded-sm">
                  <Image source={{ uri: entry.image_url }} className="w-full h-full" resizeMode="cover" />
                </View>
              </View>
            </View>
          )}

          {/* Custom Interactive Voice Player Widget */}
          {voiceMatch && (
            <Card className="p-4 mb-6 border border-pink-100 bg-pink-50/15">
              <Text className="text-xs font-bold text-pink-600 mb-2">🎙️ Voice Capsule</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={handlePlayToggle}
                  className="w-12 h-12 bg-pink-500 rounded-full justify-center items-center active:bg-pink-400"
                >
                  <Text className="text-white text-lg font-bold">
                    {isPlaying ? '⏸️' : '▶️'}
                  </Text>
                </TouchableOpacity>
                <View className="flex-1">
                  <View className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                    <View style={{ width: `${playProgress * 100}%` }} className="h-full bg-pink-500 rounded-full" />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[10px] text-text-secondary">{timerText}</Text>
                    <Text className="text-[10px] text-text-secondary">{voiceMatch[1]}</Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Content Body */}
          <Text className="text-sm text-text-secondary leading-6 text-left">{displayContent}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
