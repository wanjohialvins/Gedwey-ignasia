import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useSessionHistory } from '../../../lib/queries/sessions';
import { useJournalEntries, JournalEntry } from '../../../lib/queries/journal';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { BottomNav } from '../../../components/BottomNav';
import { isFeatureUnlocked } from '../../../lib/devMode';

export default function JournalListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch profiles and session history to enforce unlock gates
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  const { data: sessionHistory, isLoading: historyLoading } = useSessionHistory(coupleId);
  const { data: entries, isLoading: entriesLoading } = useJournalEntries(coupleId);

  const isLoading = profileLoading || historyLoading || entriesLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <Skeleton width={100} height={20} className="mt-2.5 mb-2 py-1" />
          <View className="mb-4">
            <Skeleton width={180} height={28} className="mb-2" />
            <Skeleton width={140} height={16} />
          </View>

          <View className="gap-3">
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-white p-4 rounded-2xl border border-neutral-border shadow-sm">
                <View className="flex-row justify-between mb-2">
                  <Skeleton width={80} height={14} />
                  <Skeleton width={60} height={14} />
                </View>
                <Skeleton width={160} height={18} className="mb-2" />
                <Skeleton width="95%" height={14} className="mb-1" />
                <Skeleton width="80%" height={14} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const completedSessionsCount = sessionHistory?.length ?? 0;
  const isJournalUnlocked = isFeatureUnlocked(completedSessionsCount >= 5);

  // Safeguard gate in case of direct routing
  if (!profile?.couple_id || !isJournalUnlocked) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.replace('/')}>
            <Text className="text-primary-600 text-sm font-semibold">← Home</Text>
          </TouchableOpacity>
          <View className="flex-1 justify-center items-center px-6 pb-16">
            <Text className="text-5xl mb-4">🔒</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">Journal is Locked</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
              Complete 5 shared couple sessions to unlock your private memory book.
            </Text>
            <View className="h-2 w-4/5 bg-slate-200 rounded-full mb-2 overflow-hidden">
              <View
                style={{ width: `${Math.min((completedSessionsCount / 5) * 100, 100)}%` }}
                className="h-full bg-primary-600 rounded-full"
              />
            </View>
            <Text className="text-xs font-semibold text-text-muted mb-6">
              {completedSessionsCount} of 5 sessions completed
            </Text>
            <Button
              title="Start a Session"
              onPress={() => router.replace('/session/start')}
              className="w-full"
            />
          </View>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  const renderJournalItem = ({ item }: { item: JournalEntry }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const creatorName = item.profiles?.display_name || 'Partner';

    // Parse mock voice notes
    const voiceMatch = item.content.match(/\[voice:(\d+:\d+)\]/);
    const displayContent = item.content.replace(/\[voice:\d+:\d+\]/g, '').trim();

    return (
      <TouchableOpacity
        onPress={() => router.push(`/journal/${item.id}`)}
        activeOpacity={0.7}
        className="mb-4"
      >
        <Card className="p-4 flex-col gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-primary-600">{formattedDate}</Text>
            <Text className="text-xs text-text-muted">By {creatorName}</Text>
          </View>
          
          <View className="flex-row gap-3">
            {/* Polaroid style thumbnail if image is present */}
            {item.image_url && (
              <View className="w-16 h-18 bg-white border border-slate-200 p-1 pb-4 shadow-sm rounded-sm">
                <View className="w-full h-11 bg-slate-100 overflow-hidden">
                  <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
                </View>
              </View>
            )}

            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary mb-1" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-xs text-text-secondary leading-normal" numberOfLines={2}>
                {displayContent}
              </Text>
            </View>
          </View>

          {/* Voice Capsule Badge indicator */}
          {voiceMatch && (
            <View className="flex-row self-start bg-pink-50 border border-pink-100 rounded-lg px-2 py-1 items-center gap-1 mt-1">
              <Text className="text-[10px]">🎙️</Text>
              <Text className="text-3xs font-bold text-pink-600">Voice Capsule ({voiceMatch[1]})</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="pt-2.5 mb-5">
          <TouchableOpacity className="self-start py-1 mb-1.5" onPress={() => router.replace('/')}>
            <Text className="text-primary-600 text-sm font-semibold">← Dashboard</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary">Shared Journal</Text>
          <Text className="text-sm text-text-secondary mt-0.5">Our private memory book</Text>
        </View>

        {entries && entries.length > 0 ? (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderJournalItem}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          /* Empty State */
          <View className="flex-1 justify-center items-center px-6 pb-20">
            <Text className="text-5xl mb-4">📖</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">Our Memory Book</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
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
            className="absolute bottom-24 right-6 bg-primary-600 w-14 h-14 rounded-full justify-center items-center shadow-lg active:bg-primary-500"
            onPress={() => router.push('/journal/create')}
            activeOpacity={0.8}
          >
            <Text className="text-white text-3xl font-light mt-[-4px]">+</Text>
          </TouchableOpacity>
        )}
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}
