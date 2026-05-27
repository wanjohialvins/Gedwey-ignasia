import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useActiveSession } from '../../../lib/queries/sessions';

export default function SessionStartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  const { data: activeSession, isLoading: sessionLoading } = useActiveSession(coupleId);

  const isLoading = profileLoading || sessionLoading;

  const handleNewSession = () => {
    if (!profile?.couple_id) {
      Alert.alert('Not Paired', 'You need to be paired with a partner to start a session.');
      return;
    }
    router.push('/session/mood');
  };

  const handleResumeSession = () => {
    if (!activeSession) return;

    const isUser1 = activeSession.user1_id === user?.id;
    const myAnswer = isUser1 ? activeSession.user1_answer : activeSession.user2_answer;

    if (myAnswer) {
      // Already answered, go to reveal/waiting
      router.push('/session/reveal');
    } else {
      // Need to answer
      router.push('/session/card');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
        <Text style={styles.backLinkText}>← Home</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>🎴</Text>
        <Text style={styles.title}>Couple Sessions</Text>
        <Text style={styles.subtitle}>
          Answer shared prompts together. See how your partner responds — after you both answer.
        </Text>

        {activeSession ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeLabel}>Active Session</Text>
            <Text style={styles.activeQuestion} numberOfLines={2}>
              {activeSession.cards?.text || 'Loading question...'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleResumeSession}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Continue Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNewSession}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Start New Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 50,
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
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 8,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  activeQuestion: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
