import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTimeCapsule } from '../../../lib/queries/capsules';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { formatDateTime, formatShortDate } from '../../../lib/dateUtils';

export default function CapsuleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: capsule, isLoading, error } = useTimeCapsule(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
          
          <View className="items-center mb-6">
            <Skeleton width={44} height={44} variant="circle" className="mb-2" />
            <Skeleton width={120} height={24} className="mb-2" />
            <Skeleton width={200} height={14} />
          </View>

          <View className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm mb-5">
            <View className="flex-row justify-between mb-3">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={14} />
            </View>
            <Skeleton width={160} height={20} className="mb-3" />
            <View className="h-[1px] bg-slate-200 w-full mb-3" />
            <Skeleton width="95%" height={14} className="mb-2" />
            <Skeleton width="98%" height={14} className="mb-2" />
            <Skeleton width="90%" height={14} className="mb-2" />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !capsule) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
            <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1 justify-center items-center px-6 pb-12">
            <Text className="text-5xl mb-4">⚠️</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">Failed to load capsule</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
              {error?.message || 'The requested time capsule could not be found.'}
            </Text>
            <Button
              title="Back to Vault"
              onPress={() => router.replace('/capsule')}
              className="w-full"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Client-side date check safeguard
  const openDate = new Date(capsule.open_date);
  const now = new Date();
  const isLocked = now.getTime() < openDate.getTime();

  if (isLocked) {
    const formattedOpenDate = formatDateTime(capsule.open_date);

    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
            <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
          </TouchableOpacity>
          
          <View className="flex-1 justify-center items-center px-6 pb-12">
            <Text className="text-5xl mb-4">🔒</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">Capsule is Sealed</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
              This letter to the future is currently locked. Love grows in waiting.
            </Text>

            <Card className="w-full p-5 mb-6 items-center">
              <Text className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1.5">
                Capsule Title
              </Text>
              <Text className="text-base font-bold text-text-primary text-center mb-3">
                {capsule.title}
              </Text>
              
              <View className="h-[1px] bg-slate-200 w-full mb-3" />
              
              <Text className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1.5">
                Unlocks on
              </Text>
              <Text className="text-sm font-semibold text-text-secondary text-center">
                {formattedOpenDate}
              </Text>
            </Card>

            <Button
              title="Back to Vault"
              onPress={() => router.back()}
              className="w-full"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const rawProfiles = capsule.profiles;
  const profilesObj = Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles;
  const creatorName = profilesObj?.display_name || 'Partner';
  const formattedOpenDate = formatShortDate(capsule.open_date);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
          <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Confetti celebration header */}
          <View className="items-center mb-6">
            <Text className="text-5xl mb-2">✨</Text>
            <Text className="text-2xl font-bold text-text-primary mb-1">Vault Unlocked!</Text>
            <Text className="text-sm text-text-secondary text-center px-4">
              An intimate letter from the past has been unsealed.
            </Text>
          </View>

          {/* Capsule Card */}
          <Card className="p-5">
            <View className="flex-row justify-between mb-3">
              <Text className="text-xs font-semibold text-primary-600">From {creatorName}</Text>
              <Text className="text-xs text-text-muted">Unsealed {formattedOpenDate}</Text>
            </View>
            
            <Text className="text-lg font-bold text-text-primary mb-3">{capsule.title}</Text>
            <View className="h-[1px] bg-slate-200 w-full mb-4" />
            <Text className="text-sm text-text-secondary leading-6">{capsule.content}</Text>
          </Card>

          <Button
            title="Back to Vault"
            onPress={() => router.replace('/capsule')}
            variant="secondary"
            className="w-full mt-4"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
