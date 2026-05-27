import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDiscoverySessionByToken, useSubmitGuestAnswer } from '../../lib/queries/discovery';
import { useAuthStore } from '../../lib/store/authStore';

export default function GuestRevealScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuthStore();
  
  const { data: session, isLoading, error } = useDiscoverySessionByToken(token || '');
  const submitAnswer = useSubmitGuestAnswer();

  const [guestName, setGuestName] = useState('');
  const [guestAnswer, setGuestAnswer] = useState('');

  const handleSubmit = async () => {
    if (!guestName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!guestAnswer.trim()) {
      Alert.alert('Answer Required', 'Please enter your answer.');
      return;
    }
    if (!token) return;

    try {
      await submitAnswer.mutateAsync({
        token,
        guestName: guestName.trim(),
        guestAnswer: guestAnswer.trim(),
      });
      Alert.alert('Submitted!', 'Answers have been revealed.');
    } catch (err: any) {
      Alert.alert('Failed to Submit', err.message || 'Could not submit your answer.');
    }
  };

  const handleActionClick = () => {
    if (user) {
      router.replace('/discovery');
    } else {
      router.replace('/(auth)/sign-up');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading shared moment...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.emoji}>🧐</Text>
        <Text style={styles.errorText}>
          {error?.message || 'This shared moment link is invalid or has expired.'}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = !!session.completed_at;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Moments</Text>
          <Text style={styles.appSubtitle}>for Two</Text>
          <Text style={styles.tagline}>
            {isCompleted ? 'All answers revealed!' : 'Answer to reveal responses.'}
          </Text>
        </View>

        {/* Question card */}
        <View style={styles.promptCard}>
          <Text style={styles.quoteChar}>“</Text>
          <Text style={styles.promptText}>{session.cards?.text || 'Loading prompt...'}</Text>
        </View>

        {/* Reveal State */}
        {isCompleted ? (
          <View style={styles.answersContainer}>
            {/* Creator's Answer bubble */}
            <View style={[styles.bubble, styles.creatorBubble]}>
              <View style={styles.bubbleHeader}>
                <Text style={styles.avatarEmoji}>👤</Text>
                <Text style={styles.bubbleAuthor}>Partner</Text>
              </View>
              <Text style={styles.bubbleText}>{session.creator_answer}</Text>
            </View>

            {/* Guest's Answer bubble */}
            <View style={[styles.bubble, styles.guestBubble]}>
              <View style={styles.bubbleHeader}>
                <Text style={styles.avatarEmoji}>👋</Text>
                <Text style={styles.bubbleAuthor}>{session.guest_name || 'Guest'}</Text>
              </View>
              <Text style={styles.bubbleText}>{session.guest_answer}</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleActionClick} activeOpacity={0.8}>
              <Text style={styles.buttonText}>
                {user ? 'Create Your Own card' : 'Sign Up to Start Sharing'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Form Input State */
          <View style={styles.form}>
            <Text style={styles.formTitle}>Your Response</Text>

            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              style={styles.inputName}
              placeholder="Enter your name"
              placeholderTextColor="#94A3B8"
              value={guestName}
              onChangeText={setGuestName}
            />

            <Text style={styles.inputLabel}>Your Answer</Text>
            <TextInput
              style={styles.inputAnswer}
              placeholder="Your honest answer..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={guestAnswer}
              onChangeText={setGuestAnswer}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!guestName.trim() || !guestAnswer.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!guestName.trim() || !guestAnswer.trim() || submitAnswer.isPending}
              activeOpacity={0.8}
            >
              {submitAnswer.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Submit & Reveal Answers</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#3B82F6',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
    position: 'relative',
  },
  quoteChar: {
    fontSize: 72,
    fontWeight: '700',
    color: '#EFF6FF',
    position: 'absolute',
    top: -10,
    left: 16,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 25,
    marginTop: 20,
    textAlign: 'center',
  },
  answersContainer: {
    flex: 1,
    gap: 16,
  },
  bubble: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  creatorBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  guestBubble: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    alignSelf: 'flex-end',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  bubbleAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  bubbleText: {
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputName: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  inputAnswer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
