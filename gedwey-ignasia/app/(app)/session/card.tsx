import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCards, Card } from '../../../lib/queries/cards';
import { useActiveSession, useCreateSession, useSubmitSessionAnswer } from '../../../lib/queries/sessions';

export default function SessionCardScreen() {
  const router = useRouter();
  const { mood, deck } = useLocalSearchParams<{ mood: string; deck: string }>();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  const { data: activeSession, isLoading: sessionLoading } = useActiveSession(coupleId);
  const { data: cards, isLoading: cardsLoading } = useCards(
    deck as 'discovery' | 'intimacy' | 'fun' | 'relationship_health' || undefined
  );
  const createSession = useCreateSession();
  const submitAnswer = useSubmitSessionAnswer();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [answer, setAnswer] = useState('');
  const [hasCreatedSession, setHasCreatedSession] = useState(false);

  // If there's an active session, use that card. Otherwise pick a random one.
  useEffect(() => {
    if (activeSession?.cards) {
      setSelectedCard(activeSession.cards);
    } else if (cards && cards.length > 0 && !selectedCard) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      setSelectedCard(cards[randomIndex]);
    }
  }, [activeSession, cards]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      Alert.alert('Answer Required', 'Please write your answer.');
      return;
    }
    if (!user || !profile?.couple_id || !selectedCard) return;

    try {
      if (activeSession) {
        // Join/answer existing session
        await submitAnswer.mutateAsync({
          sessionId: activeSession.id,
          coupleId: profile.couple_id,
          userId: user.id,
          answer: answer.trim(),
          mood: mood || undefined,
        });
      } else {
        // Create new session with the answer
        await createSession.mutateAsync({
          coupleId: profile.couple_id,
          cardId: selectedCard.id,
          userId: user.id,
          mood: mood || 'neutral',
        });

        // Now submit the answer to the newly created session
        // We need to re-fetch... but the create already sets user1_mood.
        // For a clean flow, we submit the answer separately
        setHasCreatedSession(true);
      }

      router.replace('/session/reveal');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit your answer.');
    }
  };

  // After session creation, submit the answer
  useEffect(() => {
    if (hasCreatedSession && activeSession && user && answer.trim()) {
      submitAnswer
        .mutateAsync({
          sessionId: activeSession.id,
          coupleId: activeSession.couple_id,
          userId: user.id,
          answer: answer.trim(),
          mood: mood || undefined,
        })
        .then(() => {
          router.replace('/session/reveal');
        })
        .catch((err) => {
          Alert.alert('Error', err.message || 'Could not submit answer.');
        });
    }
  }, [hasCreatedSession, activeSession]);

  const isLoading = sessionLoading || cardsLoading;
  const isPending = createSession.isPending || submitAnswer.isPending;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        {/* Question card */}
        {selectedCard && (
          <View style={styles.promptCard}>
            <Text style={styles.quoteChar}>"</Text>
            <Text style={styles.promptText}>{selectedCard.text}</Text>
          </View>
        )}

        {/* Answer input */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Your Answer</Text>
          <TextInput
            style={styles.input}
            placeholder="Be open and honest..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            value={answer}
            onChangeText={setAnswer}
          />

          <TouchableOpacity
            style={[styles.primaryButton, (!answer.trim() || isPending) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!answer.trim() || isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Submit Answer</Text>
            )}
          </TouchableOpacity>
        </View>
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
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 16,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 26,
    marginTop: 20,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
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
