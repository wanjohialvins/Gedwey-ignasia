import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useJournalEntries, JournalEntry } from '../../../lib/queries/journal';
import { formatShortDate } from '../../../lib/dateUtils';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { BottomNav } from '../../../components/BottomNav';
import { ScreenShell } from '../../../components/ScreenShell';
import { useTheme } from '../../../lib/hooks/useTheme';

export default function JournalListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();

  // Fetch profiles and session history to display entries
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  const { data: entries, isLoading: entriesLoading } = useJournalEntries(coupleId);

  const isLoading = profileLoading || entriesLoading;

  const getRotation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const deg = (hash % 7) - 3; // -3, -2, -1, 0, 1, 2, 3
    return `${deg}deg`;
  };

  if (isLoading) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <Skeleton width={100} height={20} className="mt-2.5 mb-2 py-1" />
            <View className="mb-4">
              <Skeleton width={180} height={28} className="mb-2" />
              <Skeleton width={140} height={16} />
            </View>

            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  className="w-[48%] bg-white/60 p-3 rounded-2xl border border-neutral-border shadow-sm mb-4"
                  style={{
                    backgroundColor: isDark ? 'rgba(28,28,31,0.5)' : 'rgba(255,255,255,0.6)',
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Skeleton width="100%" height={100} className="mb-2 rounded-lg" />
                  <Skeleton width="80%" height={16} className="mb-1" />
                  <Skeleton width="50%" height={12} />
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const renderJournalItem = ({ item }: { item: JournalEntry }) => {
    const formattedDate = formatShortDate(item.created_at);

    const rawProfiles = item.profiles;
    const profilesObj = Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles;
    const creatorName = profilesObj?.display_name || 'Partner';
    const rotation = getRotation(item.id);

    const moodsMap: Record<string, string> = {
      happy: '😊',
      peaceful: '😌',
      nostalgic: '💖',
      intimate: '🥰',
      moody: '😔',
    };

    return (
      <TouchableOpacity
        onPress={() => router.push(`/journal/${item.id}`)}
        activeOpacity={0.9}
        style={{ transform: [{ rotate: rotation }] }}
        className="w-[47%] m-[1.5%] mb-4"
      >
        <View
          className="p-3 pb-5 shadow-md border rounded-sm"
          style={{
            backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }}
        >
          {/* Polaroid style thumbnail if image is present */}
          {item.image_url ? (
            <View className="aspect-square bg-slate-100 overflow-hidden mb-3 rounded-sm border border-neutral-border">
              <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
            </View>
          ) : (
            <View
              className="aspect-square justify-center items-center mb-3 rounded-sm border"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(79, 70, 229, 0.03)',
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79, 70, 229, 0.08)',
              }}
            >
              <Text className="text-3xl mb-1">{item.mood ? moodsMap[item.mood] : '📝'}</Text>
              <Text className="text-[10px] text-text-muted">Memory Note</Text>
            </View>
          )}

          <Text
            className="text-sm font-bold text-text-primary mb-1.5"
            numberOfLines={1}
            style={{ color: theme.textPrimary }}
          >
            {item.title}
          </Text>

          <View className="flex-row justify-between items-center">
            <Text className="text-[10px] font-semibold" style={{ color: theme.accent }}>
              {formattedDate}
            </Text>
            <Text className="text-[10px] text-text-muted" numberOfLines={1}>
              {creatorName}
            </Text>
          </View>

          {/* Badges footer */}
          <View className="flex-row flex-wrap gap-1 mt-2.5">
            {item.mood && (
              <View className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/50" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: 'transparent' }}>
                <Text className="text-[8px]">{moodsMap[item.mood]} {item.mood}</Text>
              </View>
            )}
            {item.voice_url && (
              <View className="px-1.5 py-0.5 rounded-full bg-pink-100/30 border border-pink-200/20">
                <Text className="text-[8px] text-pink-500 font-bold">🎙️ Voice</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          {/* Header */}
          <View className="pt-2.5 mb-5">
            <TouchableOpacity className="self-start py-1 mb-1.5" onPress={() => router.replace('/')}>
              <Text style={{ color: theme.accent }} className="text-sm font-semibold">← Dashboard</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-text-primary" style={{ color: theme.textPrimary }}>Shared Journal</Text>
            <Text className="text-sm text-text-secondary mt-0.5" style={{ color: theme.textSecondary }}>Our private memory scrapbook</Text>
          </View>

          {entries && entries.length > 0 ? (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id}
              renderItem={renderJournalItem}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 130 }}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{ justifyContent: 'flex-start' }}
            />
          ) : (
            /* Empty State */
            <View className="flex-1 justify-center items-center px-6 pb-20">
              <Text className="text-5xl mb-4">📖</Text>
              <Text className="text-xl font-bold text-text-primary mb-2 text-center" style={{ color: theme.textPrimary }}>Our Memory Book</Text>
              <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4" style={{ color: theme.textSecondary }}>
                This is your private couple space. Write down your first memory today!
              </Text>
              <Button
                title="Write First Entry"
                onPress={() => router.push('/journal/create')}
                className="w-full"
              />
            </View>
          )}

          {/* Floating Action Button */}
          {entries && entries.length > 0 && (
            <TouchableOpacity
              style={{ backgroundColor: theme.accent }}
              className="absolute bottom-28 right-6 w-14 h-14 rounded-full justify-center items-center shadow-lg active:opacity-90"
              onPress={() => router.push('/journal/create')}
              activeOpacity={0.8}
            >
              <Text className="text-white text-3xl font-light mt-[-4px]">+</Text>
            </TouchableOpacity>
          )}
        </View>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}
