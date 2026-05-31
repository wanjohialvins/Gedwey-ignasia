import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { BottomNav } from '../../components/BottomNav';
import { Card } from '../../components/Card';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import { getPetCareHint, getPetMood, useCouplePet, usePetCare } from '../../lib/queries/coupleFeatures';
import { useLogActivity } from '../../lib/queries/engagement';
import { partnerWantsNotifications } from '../../lib/notificationPrefs';
import { sendPushNotification } from '../../lib/notifications';
import { useTheme } from '../../lib/hooks/useTheme';
import { broadcastLiveActivity } from '../../components/LivePartnerWidget';

const PET_IMAGE = require('../../assets/pet-cat.png');

const TASKS = [
  { id: 'feed' as const, emoji: '🍽️', label: 'Feed', stat: 'hunger' as const, animEmoji: '🐟', statusText: 'Yum! 😋' },
  { id: 'scratch' as const, emoji: '🐾', label: 'Scratch', stat: 'happiness' as const, animEmoji: '💕', statusText: 'Purrrr! 😻' },
  { id: 'bathe' as const, emoji: '🛁', label: 'Bath', stat: 'cleanliness' as const, animEmoji: '🫧', statusText: 'So fresh! ✨' },
];

export default function CatCareScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile } = useUserProfile(profile?.partner_id ?? '');
  const { data: pet, isLoading } = useCouplePet(profile?.couple_id ?? '');
  const petCare = usePetCare();
  const logActivity = useLogActivity();
  const { theme } = useTheme();

  const [activeAnim, setActiveAnim] = useState<string | null>(null);
  const [petBounce, setPetBounce] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const petMood = useMemo(() => (pet ? getPetMood(pet) : null), [pet]);
  const careHint = useMemo(() => (pet ? getPetCareHint(pet) : ''), [pet]);

  const handleCare = async (careType: 'feed' | 'scratch' | 'bathe') => {
    if (!profile?.couple_id || !user?.id) {
      Alert.alert('Pair first', 'Connect with your partner to care for your shared cat.');
      return;
    }

    const task = TASKS.find((t) => t.id === careType);
    setActiveAnim(careType);
    setPetBounce(true);
    setStatusText(task?.statusText || null);
    setAnimKey((k) => k + 1);
    setTimeout(() => {
      setActiveAnim(null);
      setPetBounce(false);
    }, 1800);
    setTimeout(() => {
      setStatusText(null);
    }, 2200);

    try {
      await petCare.mutateAsync({ coupleId: profile.couple_id, userId: user.id, careType });
      await logActivity.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        activityType: 'game',
        title: `Cat care: ${task?.label}`,
        metadata: { careType, catCare: true },
      });
      broadcastLiveActivity(profile.couple_id, user.id, 'Cat care', task?.label || careType);

      if (partnerProfile?.expo_push_token && partnerWantsNotifications(partnerProfile)) {
        sendPushNotification(
          partnerProfile.expo_push_token,
          'Cat Care Reminder 🐱',
          `${profile.display_name || 'Your partner'} just ${careType === 'feed' ? 'fed' : careType === 'scratch' ? 'scratched' : 'bathed'} the cat. Your turn!`,
          { type: 'cat_care', careType }
        );
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not complete care.');
    }
  };

  const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs font-bold capitalize" style={{ color: theme.textSecondary }}>{label}</Text>
        <Text className="text-xs font-bold" style={{ color: theme.textPrimary }}>{value}%</Text>
      </View>
      <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
        <View className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </View>
    </View>
  );

  const activeTask = TASKS.find((t) => t.id === activeAnim);

  return (
    <ScreenShell variant="hero" className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-5 flex-row items-center gap-1">
          <AppIcon name="arrow-back" size={16} color={theme.accent} />
          <Text className="text-sm font-bold" style={{ color: theme.accent }}>Back</Text>
        </TouchableOpacity>

        <View className="items-center mb-2 relative">
          <MotiView
            animate={{
              scale: petBounce ? [1, 1.08, 0.98, 1] : 1,
              rotate: activeAnim === 'scratch' ? ['0deg', '-4deg', '4deg', '-2deg', '0deg'] : '0deg',
            }}
            transition={{ type: 'timing', duration: 700 }}
          >
            <Image source={PET_IMAGE} className="w-40 h-40" resizeMode="contain" />
          </MotiView>

          {/* Main activity emoji float */}
          {activeTask ? (
            <MotiView
              key={`main-${animKey}`}
              from={{ opacity: 1, translateY: 10, scale: 0.8 }}
              animate={{ opacity: 0, translateY: -60, scale: 1.4 }}
              transition={{ type: 'timing', duration: 1400 }}
              className="absolute top-0"
            >
              <Text className="text-4xl">{activeTask.animEmoji}</Text>
            </MotiView>
          ) : null}

          {/* Feed animation — fish particles moving toward cat */}
          {activeAnim === 'feed' ? (
            <>
              {[0, 1, 2].map((i) => (
                <MotiView
                  key={`feed-${animKey}-${i}`}
                  from={{ opacity: 0.9, translateY: 80, translateX: -40 + i * 40, scale: 0.6 }}
                  animate={{ opacity: 0, translateY: 20, translateX: (i - 1) * 10, scale: 1.1 }}
                  transition={{ type: 'timing', duration: 1000, delay: i * 200 }}
                  className="absolute"
                  style={{ top: 40 }}
                >
                  <Text className="text-2xl">{i % 2 === 0 ? '🐟' : '🍗'}</Text>
                </MotiView>
              ))}
            </>
          ) : null}

          {/* Scratch animation — hearts floating up with wiggle */}
          {activeAnim === 'scratch' ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <MotiView
                  key={`scratch-${animKey}-${i}`}
                  from={{ opacity: 1, translateY: 30, translateX: -20 + i * 14, scale: 0.5 }}
                  animate={{ opacity: 0, translateY: -50, translateX: -20 + i * 14 + (i % 2 === 0 ? 10 : -10), scale: 1.2 }}
                  transition={{ type: 'timing', duration: 1200, delay: i * 150 }}
                  className="absolute"
                  style={{ top: 20 }}
                >
                  <Text className="text-xl">{['💕', '❤️', '💗', '😻'][i]}</Text>
                </MotiView>
              ))}
            </>
          ) : null}

          {/* Bath animation — enhanced bubbles */}
          {activeAnim === 'bathe' ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <MotiView
                  key={`bath-${animKey}-${i}`}
                  from={{ opacity: 0.9, translateY: 0, translateX: (i - 2) * 18 }}
                  animate={{ opacity: 0, translateY: -40 - i * 8 }}
                  transition={{ type: 'timing', duration: 1000, delay: i * 100 }}
                  className="absolute"
                  style={{ top: 55 + (i % 2) * 12 }}
                >
                  <Text className="text-xl">{i % 2 === 0 ? '🫧' : '💦'}</Text>
                </MotiView>
              ))}
            </>
          ) : null}

          {/* Status text flash */}
          {statusText ? (
            <MotiView
              key={`status-${animKey}`}
              from={{ opacity: 1, translateY: 0, scale: 0.8 }}
              animate={{ opacity: 0, translateY: -20, scale: 1.1 }}
              transition={{ type: 'timing', duration: 2000, delay: 400 }}
              className="absolute"
              style={{ bottom: -8 }}
            >
              <Text className="text-base font-bold" style={{ color: theme.accent }}>{statusText}</Text>
            </MotiView>
          ) : null}
        </View>

        <Text className="text-2xl font-bold text-center mb-1" style={{ color: theme.textPrimary }}>
          {pet?.name || 'Your Cat'}
        </Text>
        {petMood ? (
          <Text className="text-sm text-center mb-2 px-4" style={{ color: theme.textSecondary }}>
            {petMood.emoji} {petMood.message}
          </Text>
        ) : null}
        {careHint ? (
          <Text className="text-xs text-center mb-5 px-6 italic" style={{ color: theme.accent }}>
            {careHint}
          </Text>
        ) : (
          <Text className="text-sm text-center mb-5 px-4" style={{ color: theme.textSecondary }}>
            Daily care boosts your streak. Both partners see live stats and get reminders.
          </Text>
        )}

        <Card className="p-5 mb-5">
          {isLoading || !pet ? (
            <Text className="text-sm text-center" style={{ color: theme.textSecondary }}>Loading cat...</Text>
          ) : (
            <>
              <StatBar label="Hunger" value={pet.hunger} color="#F59E0B" />
              <StatBar label="Happiness" value={pet.happiness} color="#EC4899" />
              <StatBar label="Cleanliness" value={pet.cleanliness} color="#06B6D4" />
            </>
          )}
        </Card>

        <View className="flex-row justify-center gap-6 mb-6">
          <View className="items-center">
            <ProfileAvatar uri={profile?.avatar_url} name={profile?.display_name} size={48} />
            <Text className="text-xs font-bold mt-1 capitalize" style={{ color: theme.textPrimary }}>You</Text>
          </View>
          <View className="items-center">
            <ProfileAvatar uri={partnerProfile?.avatar_url} name={partnerProfile?.display_name} size={48} />
            <Text className="text-xs font-bold mt-1 capitalize" style={{ color: theme.textPrimary }}>
              {partnerProfile?.display_name || 'Partner'}
            </Text>
          </View>
        </View>

        {TASKS.map((task) => (
          <Card key={task.id} className="p-4 mb-3">
            <View className="flex-row items-center gap-3 mb-3">
              <MotiView
                animate={activeAnim === task.id ? { scale: [1, 1.3, 1], rotate: ['0deg', '12deg', '-8deg', '0deg'] } : { scale: 1 }}
                transition={{ type: 'timing', duration: 600 }}
              >
                <Text className="text-3xl">{task.emoji}</Text>
              </MotiView>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{task.label}</Text>
                {activeAnim === task.id ? (
                  <MotiView
                    key={`label-${animKey}-${task.id}`}
                    from={{ opacity: 0, translateX: -5 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <Text className="text-xs font-bold" style={{ color: theme.accent }}>{task.statusText}</Text>
                  </MotiView>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleCare(task.id)}
                disabled={petCare.isPending}
                className="px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: theme.accent }}
              >
                <Text className="text-xs font-bold text-white">Do it</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
