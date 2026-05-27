import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUpdateProfile } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Moments</Text>
        <Text style={styles.subtitle}>Choose how you want to experience the app. You can always change this later.</Text>
      </View>

      <View style={styles.optionsList}>
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedMode(mode.key)}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{mode.emoji}</Text>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{mode.title}</Text>
                <Text style={styles.cardDescription}>{mode.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !selectedMode && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selectedMode || updateProfile.isPending}
        activeOpacity={0.8}
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  optionsList: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    marginVertical: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 32,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#2563EB',
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
