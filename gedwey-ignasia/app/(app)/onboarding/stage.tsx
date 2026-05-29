import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile, useUpdateProfile } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';
import { Button } from '../../../components/Button';
import { Skeleton } from '../../../components/Skeleton';

export default function StageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useUserProfile(user?.id ?? '');
  const updateProfile = useUpdateProfile();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedStage) {
      Alert.alert('Selection Required', 'Please choose a stage to continue.');
      return;
    }
    if (!user || !profile) {
      Alert.alert('Error', 'Profile data is missing.');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        id: user.id,
        relationship_stage: selectedStage,
      });

      // If app mode is discovery, onboarding is complete
      if (profile.app_mode === 'discovery') {
        router.replace('/');
      } else {
        // Navigate to the invite/pairing screen
        router.push('/onboarding/invite');
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update relationship stage.');
    }
  };

  const stages = [
    {
      key: 'discovery',
      title: 'Discovery Stage',
      description: 'Getting to know new connections or testing compatibility.',
      emoji: '👀',
    },
    {
      key: 'early_dating',
      title: 'Early Dating',
      description: 'Dating and having fun, keeping it light and engaging.',
      emoji: '🌱',
    },
    {
      key: 'serious_relationship',
      title: 'Serious Relationship',
      description: 'Committed partners growing closer together day by day.',
      emoji: '💞',
    },
    {
      key: 'long_term_partnership',
      title: 'Long-Term Partnership',
      description: 'Long-term partners, engaged, or married couples building a life.',
      emoji: '💍',
    },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16 pb-6 justify-between">
        <View className="mb-6 items-center">
          <Skeleton width={180} height={28} className="mb-3" />
          <Skeleton width={260} height={16} className="mb-1" />
          <Skeleton width={200} height={16} />
        </View>
        <View className="flex-1 justify-center gap-4 my-4">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="bg-white rounded-2xl p-4 flex-row items-center border border-neutral-border shadow-sm">
              <Skeleton width={44} height={44} variant="circle" className="mr-4" />
              <View className="flex-1 gap-1.5">
                <Skeleton width={120} height={16} />
                <Skeleton width="90%" height={12} />
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row gap-3">
          <Skeleton width="30%" height={48} className="rounded-xl" />
          <Skeleton width="67%" height={48} className="rounded-xl" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-16 pb-6 justify-between">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary text-center mb-2">Define Your Stage</Text>
        <Text className="text-sm text-text-secondary text-center px-4 leading-relaxed">
          Help us customize the questions and features for your current relationship.
        </Text>
      </View>

      <View className="flex-1 justify-center gap-3 my-4">
        {stages.map((stage) => {
          const isSelected = selectedStage === stage.key;
          return (
            <TouchableOpacity
              key={stage.key}
              style={{ borderWidth: isSelected ? 2 : 1 }}
              className={`bg-white rounded-2xl p-3.5 flex-row items-center shadow-sm ${
                isSelected ? 'border-primary-600 bg-primary-100/50' : 'border-neutral-border'
              }`}
              onPress={() => setSelectedStage(stage.key)}
              activeOpacity={0.85}
            >
              <Text className="text-3xl mr-3.5">{stage.emoji}</Text>
              <View className="flex-1">
                <Text 
                  className={`text-base font-semibold mb-0.5 ${
                    isSelected ? 'text-primary-600' : 'text-text-primary'
                  }`}
                >
                  {stage.title}
                </Text>
                <Text className="text-xs text-text-secondary leading-relaxed">
                  {stage.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 h-12 bg-white border border-slate-300 rounded-xl items-center justify-center active:bg-slate-50"
          onPress={() => router.back()}
          disabled={updateProfile.isPending}
          activeOpacity={0.8}
        >
          <Text className="text-text-secondary text-base font-semibold">Back</Text>
        </TouchableOpacity>

        <View className="flex-[2]">
          <Button
            title={updateProfile.isPending ? 'Saving...' : 'Continue'}
            onPress={handleContinue}
            disabled={!selectedStage || updateProfile.isPending}
            loading={updateProfile.isPending}
          />
        </View>
      </View>
    </View>
  );
}
