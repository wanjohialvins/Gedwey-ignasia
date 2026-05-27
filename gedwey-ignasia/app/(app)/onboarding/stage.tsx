import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile, useUpdateProfile } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading stages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Define Your Stage</Text>
        <Text style={styles.subtitle}>
          Help us customize the questions and features for your current relationship.
        </Text>
      </View>

      <View style={styles.optionsList}>
        {stages.map((stage) => {
          const isSelected = selectedStage === stage.key;
          return (
            <TouchableOpacity
              key={stage.key}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedStage(stage.key)}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{stage.emoji}</Text>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{stage.title}</Text>
                <Text style={styles.cardDescription}>{stage.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={updateProfile.isPending}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, !selectedStage && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedStage || updateProfile.isPending}
          activeOpacity={0.8}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 16,
  },
  header: {
    marginBottom: 16,
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
    gap: 12,
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardTitleSelected: {
    color: '#2563EB',
  },
  cardDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
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
