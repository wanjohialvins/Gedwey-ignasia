import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useTimeCapsules, useOpenTimeCapsule, TimeCapsule } from '../../../lib/queries/capsules';
import { scheduleLocalNotification, NOTIFICATION_CHANNELS } from '../../../lib/notifications';
import { userWantsCapsuleNotifications } from '../../../lib/notificationPrefs';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { ScreenShell } from '../../../components/ScreenShell';
import { formatDateTime, formatShortDate } from '../../../lib/dateUtils';

function getCountdownText(openDateString: string): { label: string; isReady: boolean } {
  const openDate = new Date(openDateString);
  const now = new Date();
  const diffMs = openDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { label: 'Ready to open! ✨', isReady: true };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return { label: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`, isReady: false };
  }

  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  return { label: `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} left`, isReady: false };
}

export default function CapsuleListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  const { data: capsules, isLoading: capsulesLoading } = useTimeCapsules(coupleId);
  const openTimeCapsule = useOpenTimeCapsule();

  const isLoading = profileLoading || capsulesLoading;

  // Schedule local notifications for future capsules on list load
  React.useEffect(() => {
    if (!capsules || capsules.length === 0 || !userWantsCapsuleNotifications(profile)) return;

    capsules.forEach((capsule) => {
      if (capsule.is_opened) return;
      const openTime = new Date(capsule.open_date).getTime();
      const delaySeconds = Math.floor((openTime - Date.now()) / 1000);

      if (delaySeconds > 0) {
        scheduleLocalNotification(
          'Time Capsule Unlocked! ⏳',
          `Your time capsule "${capsule.title}" is ready to be opened.`,
          delaySeconds,
          {
            identifier: capsule.id,
            channelId: NOTIFICATION_CHANNELS.capsules,
            data: { type: 'capsule_ready', capsuleId: capsule.id },
          }
        );
      }
    });
  }, [capsules, profile]);

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

            <View className="gap-4">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-white/60 p-4 rounded-2xl border border-neutral-border/10 shadow-sm">
                  <View className="flex-row justify-between mb-3 items-center">
                    <Skeleton width={100} height={14} />
                    <Skeleton width={60} height={18} className="rounded-lg" />
                  </View>
                  <Skeleton width={160} height={18} className="mb-3" />
                  <View className="border-t border-slate-100/50 pt-3 flex-row justify-between">
                    <Skeleton width={80} height={12} />
                    <Skeleton width={70} height={12} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const handlePressCapsule = async (item: TimeCapsule) => {
    const { label, isReady } = getCountdownText(item.open_date);

    if (!isReady) {
      Alert.alert(
        'Capsule Locked 🔒',
        `Patience! This capsule is sealed until ${formatDateTime(item.open_date)}. There is ${label} remaining.`
      );
      return;
    }

    if (!item.is_opened) {
      try {
        await openTimeCapsule.mutateAsync({
          capsuleId: item.id,
          coupleId: item.couple_id,
        });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not open the capsule.');
        return;
      }
    }

    router.push(`/capsule/${item.id}`);
  };

  const renderCapsuleItem = ({ item }: { item: TimeCapsule }) => {
    const { label, isReady } = getCountdownText(item.open_date);
    const creatorName = item.profiles?.display_name || 'Partner';
    
    const formattedOpenDate = formatShortDate(item.open_date);

    return (
      <TouchableOpacity
        onPress={() => handlePressCapsule(item)}
        activeOpacity={0.7}
        className="mb-4"
      >
        <Card className={!isReady ? 'opacity-95' : ''}>
          <View className="flex-row justify-between items-center mb-2.5">
            <Text className="text-xs font-semibold text-text-muted">Locked by {creatorName}</Text>
            {isReady ? (
              item.is_opened ? (
                <View className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                  <Text className="text-[10px] font-bold text-text-secondary">📖 Opened</Text>
                </View>
              ) : (
                <View className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  <Text className="text-[10px] font-bold text-emerald-600">✨ Ready</Text>
                </View>
              )
            ) : (
              <View className="bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                <Text className="text-[10px] font-bold text-primary-600">🔒 Locked</Text>
              </View>
            )}
          </View>

          <Text className="text-base font-bold text-text-primary mb-3">{item.title}</Text>

          <View className="flex-row justify-between pt-2.5 border-t border-slate-100">
            <Text className="text-xs text-text-muted">Unlocks on</Text>
            <Text className="text-xs font-semibold text-slate-700">{formattedOpenDate}</Text>
          </View>

          {!isReady && (
            <View className="mt-2 bg-slate-50 rounded-lg py-2 items-center">
              <Text className="text-xs font-semibold text-primary-600">Sealed: {label}</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4 pt-4">
          {/* Header */}
          <View className="mb-5">
            <TouchableOpacity className="self-start py-1 mb-1.5" onPress={() => router.replace('/')}>
              <Text className="text-primary-600 text-sm font-semibold">← Dashboard</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-text-primary">Time Capsules</Text>
            <Text className="text-sm text-text-secondary mt-0.5">Our sealed letters to the future</Text>
          </View>

          {capsules && capsules.length > 0 ? (
            <FlatList
              data={capsules}
              keyExtractor={(item) => item.id}
              renderItem={renderCapsuleItem}
              contentContainerStyle={{ paddingBottom: 80 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            /* Empty State */
            <View className="flex-1 justify-center items-center px-6 pb-20">
              <Text className="text-5xl mb-4">⏳</Text>
              <Text className="text-xl font-bold text-text-primary mb-2 text-center">Time Capsule Vault</Text>
              <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
                Seal a memory, photo reference, or letter to open together in the future.
              </Text>
              <Button
                title="Seal First Capsule"
                onPress={() => router.push('/capsule/create')}
                className="w-full"
              />
            </View>
          )}

          {/* Floating Action Button */}
          {capsules && capsules.length > 0 && (
            <TouchableOpacity
              className="absolute bottom-6 right-6 bg-primary-600 w-14 h-14 rounded-full justify-center items-center shadow-lg active:bg-primary-500"
              onPress={() => router.push('/capsule/create')}
              activeOpacity={0.8}
            >
              <Text className="text-white text-3xl font-light mt-[-4px]">+</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}
