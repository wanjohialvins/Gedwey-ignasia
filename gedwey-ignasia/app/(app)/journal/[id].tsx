import React from 'react';
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
import { ScreenShell } from '../../../components/ScreenShell';
import { VoicePlaybackBubble } from '../../../components/VoicePlaybackBubble';
import { formatLongDate } from '../../../lib/dateUtils';
import { useTheme } from '../../../lib/hooks/useTheme';
import { AppIcon } from '../../../components/AppIcon';
import { NAV_ICONS } from '../../../lib/navigationIcons';

export default function JournalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  
  const { data: entry, isLoading, error } = useJournalEntry(id ?? '');

  if (isLoading) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
            
            <View className="pt-2.5 mb-4">
              <Skeleton width="80%" height={28} className="mb-3" />
              <View className="flex-row justify-between">
                <Skeleton width={140} height={14} />
                <Skeleton width={100} height={14} />
              </View>
            </View>
            <View className="h-[1px] w-full mb-5" style={{ backgroundColor: theme.border }} />

            <View className="gap-2.5">
              <Skeleton width="95%" height={16} />
              <Skeleton width="98%" height={16} />
              <Skeleton width="90%" height={16} />
              <Skeleton width="40%" height={16} />
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  if (error || !entry) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            {/* ── Standardized Header ── */}
            <View className="flex-row items-center justify-between pt-2.5 mb-5">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-indigo-50/60 items-center justify-center rounded-full active:opacity-75"
              >
                <AppIcon name="arrow-back" size={20} color="#4F46E5" />
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                <AppIcon name={NAV_ICONS.journal} size={22} color="#4F46E5" />
                <Text className="text-lg font-extrabold text-text-primary">Memory Detail</Text>
              </View>
              <View className="w-10" />
            </View>
            <View className="flex-1 justify-center items-center px-6 pb-12">
              <Text className="text-5xl mb-4">⚠️</Text>
              <Text className="text-xl font-bold text-text-primary mb-2 text-center" style={{ color: theme.textPrimary }}>Failed to load memory</Text>
              <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4" style={{ color: theme.textSecondary }}>
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
      </ScreenShell>
    );
  }

  const formattedDate = formatLongDate(entry.created_at);

  const rawProfiles = entry.profiles;
  const profilesObj = Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles;
  const creatorName = profilesObj?.display_name || 'Partner';

  const moodsMap: Record<string, string> = {
    happy: '😊 Happy',
    peaceful: '😌 Peaceful',
    nostalgic: '💖 Nostalgic',
    intimate: '🥰 Intimate',
    moody: '😔 Moody',
  };

  const getRotationAngle = (idStr?: string) => {
    if (!idStr) return '0deg';
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const angle = (hash % 4) - 2; // Returns -2, -1, 0, or 1
    return `${angle}deg`;
  };

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          {/* ── Standardized Header ── */}
          <View className="flex-row items-center justify-between pt-2.5 mb-5">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-indigo-50/60 items-center justify-center rounded-full active:opacity-75"
            >
              <AppIcon name="arrow-back" size={20} color="#4F46E5" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-2">
              <AppIcon name={NAV_ICONS.journal} size={22} color="#4F46E5" />
              <Text className="text-lg font-extrabold text-text-primary">Memory Detail</Text>
            </View>
            <View className="w-10" />
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Card glass className="p-6 border shadow-md flex-col gap-4">
              {/* Header section */}
              <View>
                <Text className="text-2xl font-bold text-text-primary mb-2 leading-normal" style={{ color: theme.textPrimary }}>
                  {entry.title}
                </Text>
                
                <View className="flex-row justify-between items-center flex-wrap gap-2">
                  <Text className="text-xs font-semibold" style={{ color: theme.accent }}>
                    {formattedDate}
                  </Text>
                  <Text className="text-xs text-text-muted font-medium" style={{ color: theme.textTertiary }}>
                    Written by {creatorName}
                  </Text>
                </View>
                
                {entry.mood && moodsMap[entry.mood] && (
                  <View className="self-start mt-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/50" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: 'transparent' }}>
                    <Text className="text-2xs font-bold" style={{ color: theme.textPrimary }}>
                      Feeling: {moodsMap[entry.mood]}
                    </Text>
                  </View>
                )}
              </View>

              {/* Divider */}
              <View className="h-[1px] w-full" style={{ backgroundColor: theme.border }} />

              {/* Polaroid Photo Section */}
              {entry.image_url && (
                <View className="items-center my-2">
                  <View 
                    style={{ transform: [{ rotate: getRotationAngle(entry.id) }] }}
                    className="bg-white border border-slate-200 p-3 pb-8 shadow-lg rounded-sm w-full max-w-[280px]"
                  >
                    <View className="w-full h-56 bg-slate-100 overflow-hidden rounded-sm">
                      <Image source={{ uri: entry.image_url }} className="w-full h-full" resizeMode="cover" />
                    </View>
                  </View>
                </View>
              )}

              {/* Content Body */}
              <Text className="text-sm text-text-secondary leading-6 text-left" style={{ color: theme.textSecondary }}>
                {entry.content}
              </Text>

              {/* Real Voice Playback bubble */}
              {entry.voice_url && (
                <View className="mt-2">
                  <Text className="text-xs font-bold text-pink-600 mb-2">🎙️ Voice Capsule</Text>
                  <VoicePlaybackBubble url={entry.voice_url} duration={entry.voice_duration} />
                </View>
              )}
            </Card>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}
