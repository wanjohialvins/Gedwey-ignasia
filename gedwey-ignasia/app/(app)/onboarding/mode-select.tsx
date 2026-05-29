import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUpdateProfile } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';
import { Button } from '../../../components/Button';

type AppMode = 'discovery' | 'early_dating' | 'couples';

export default function ModeSelectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const [selectedMode, setSelectedMode] = useState<AppMode | null>(null);

  const handleContinue = async () => {
    if (!selectedMode) {
      Alert.alert('Selection Required', 'Please choose a mode to continue.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'No authenticated user found.');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        id: user.id,
        app_mode: selectedMode,
      });
      // Navigate to the stage select screen
      router.push('/onboarding/stage');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update your selection.');
    }
  };

  const modes: { key: AppMode; title: string; description: string; emoji: string }[] = [
    {
      key: 'discovery',
      title: 'Discovery Mode',
      description: 'Answer fun questions, generate links, and share with anyone to reveal responses!',
      emoji: '✨',
    },
    {
      key: 'early_dating',
      title: 'Early Dating',
      description: 'Get to know each other through curated daily questions and shared sessions.',
      emoji: '🌱',
    },
    {
      key: 'couples',
      title: 'Couples Mode',
      description: 'A private space for serious couples to track health, milestones, journal, and capsules.',
      emoji: '❤️',
    },
  ];

  return (
    <View className="flex-1 bg-background px-4 pt-16 pb-6 justify-between">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary text-center mb-2">Welcome to Moments</Text>
        <Text className="text-sm text-text-secondary text-center px-4 leading-relaxed">
          Choose how you want to experience the app. You can always change this later.
        </Text>
      </View>

      <View className="flex-1 justify-center gap-4 my-4">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              style={{ borderWidth: isSelected ? 2 : 1 }}
              className={`bg-white rounded-2xl p-4 flex-row items-center shadow-sm ${
                isSelected ? 'border-primary-600 bg-primary-100/50' : 'border-neutral-border'
              }`}
              onPress={() => setSelectedMode(mode.key)}
              activeOpacity={0.85}
            >
              <Text className="text-4xl mr-4">{mode.emoji}</Text>
              <View className="flex-1">
                <Text 
                  className={`text-base font-semibold mb-1 ${
                    isSelected ? 'text-primary-600' : 'text-text-primary'
                  }`}
                >
                  {mode.title}
                </Text>
                <Text className="text-xs text-text-secondary leading-relaxed">
                  {mode.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title={updateProfile.isPending ? 'Saving...' : 'Continue'}
        onPress={handleContinue}
        disabled={!selectedMode || updateProfile.isPending}
        loading={updateProfile.isPending}
      />
    </View>
  );
}
