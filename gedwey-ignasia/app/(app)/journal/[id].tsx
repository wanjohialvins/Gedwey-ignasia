import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useJournalEntry } from '../../../lib/queries/journal';
import { Button } from '../../../components/Button';
import { Skeleton } from '../../../components/Skeleton';

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

  const formattedDate = new Date(entry.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const creatorName = entry.profiles?.display_name || 'Partner';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
          <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header section */}
          <View className="pt-2.5 mb-4">
            <Text className="text-2xl font-bold text-text-primary mb-3 leading-normal">{entry.title}</Text>
            <View className="flex-row justify-between items-center flex-wrap gap-2">
              <Text className="text-xs font-semibold text-primary-600">{formattedDate}</Text>
              <Text className="text-xs text-text-muted font-medium">Written by {creatorName}</Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-slate-200 w-full mb-5" />

          {/* Content Body */}
          <Text className="text-sm text-text-secondary leading-6 text-left">{entry.content}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
