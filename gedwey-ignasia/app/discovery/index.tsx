import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCards, Card } from '../../lib/queries/cards';
import { useCreateDiscoverySession } from '../../lib/queries/discovery';
import { useAuthStore } from '../../lib/store/authStore';

// Function to generate a unique 16-character token
const generateToken = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Fallback questions in case the database cards table is empty
const FALLBACK_CARDS: Card[] = [
  {
    id: 'f1-fallback-uuid',
    created_at: new Date().toISOString(),
    text: 'What was your very first impression of me, and how has it changed?',
    category: 'discovery',
    min_relationship_stage: null,
  },
  {
    id: 'f2-fallback-uuid',
    created_at: new Date().toISOString(),
    text: 'What is your idea of a perfect weekend getaway together?',
    category: 'discovery',
    min_relationship_stage: null,
  },
  {
    id: 'f3-fallback-uuid',
    created_at: new Date().toISOString(),
    text: 'What is one small thing I do that always makes you smile?',
    category: 'discovery',
    min_relationship_stage: null,
  },
];

export default function DiscoveryHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: cards, isLoading: cardsLoading, error: cardsError } = useCards('discovery');
  const createSession = useCreateDiscoverySession();

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [answer, setAnswer] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  // Set initial random card when cards load
  useEffect(() => {
    const cardsList = cards && cards.length > 0 ? cards : FALLBACK_CARDS;
    if (cardsList && cardsList.length > 0 && !currentCard) {
      const randomIndex = Math.floor(Math.random() * cardsList.length);
      setCurrentCard(cardsList[randomIndex]);
    }
  }, [cards]);

  const handleShuffle = () => {
    const cardsList = cards && cards.length > 0 ? cards : FALLBACK_CARDS;
    if (cardsList && cardsList.length > 1) {
      let nextCard = currentCard;
      while (nextCard?.id === currentCard?.id) {
        const randomIndex = Math.floor(Math.random() * cardsList.length);
        nextCard = cardsList[randomIndex];
      }
      setCurrentCard(nextCard);
      setAnswer('');
      setShareLink('');
    }
  };

  const handleGenerateLink = async () => {
    if (!answer.trim()) {
      Alert.alert('Answer Required', 'Please type your answer before sharing.');
      return;
    }
    if (!currentCard || !user) {
      Alert.alert('Error', 'Missing session credentials.');
      return;
    }

    try {
      const token = generateToken();
      await createSession.mutateAsync({
        cardId: currentCard.id,
        creatorId: user.id,
        creatorAnswer: answer.trim(),
        token: token,
      });

      // Generate deep link URL
      const link = Linking.createURL('discovery/' + token);
      setShareLink(link);
      setSessionToken(token);
    } catch (err: any) {
      Alert.alert('Session Creation Failed', err.message || 'Could not create discovery session.');
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      Clipboard.setString(shareLink);
      Alert.alert('Link Copied!', 'Share link copied to clipboard. Send it to your partner or guest.');
    }
  };

  if (cardsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Fetching question cards...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
            <Text style={styles.backLinkText}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Discovery Mode</Text>
          <Text style={styles.subtitle}>
            Break the ice! Answer a question, share your custom link, and unlock their answer together.
          </Text>
        </View>

        {/* Card prompt */}
        {currentCard && (
          <View style={styles.promptCard}>
            <Text style={styles.quoteChar}>“</Text>
            <Text style={styles.promptText}>{currentCard.text}</Text>
            <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle} activeOpacity={0.7}>
              <Text style={styles.shuffleText}>🔀 Shuffle Question</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Share Link Screen State */}
        {shareLink ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>🎉 Link Generated!</Text>
            <Text style={styles.successText}>
              Your answer has been saved. Share the link below with your partner/guest. Once they answer, both responses will be revealed.
            </Text>

            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
                {shareLink}
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleCopyLink} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Copy Share Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push(`/discovery/${sessionToken}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Open Guest Screen (Local Test)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Form Screen State */
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Your Answer</Text>
            <TextInput
              style={styles.input}
              placeholder="Be honest and expressive..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={answer}
              onChangeText={setAnswer}
            />

            <TouchableOpacity
              style={[styles.primaryButton, !answer.trim() && styles.buttonDisabled]}
              onPress={handleGenerateLink}
              disabled={!answer.trim() || createSession.isPending}
              activeOpacity={0.8}
            >
              {createSession.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Generate Share Link</Text>
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
  header: {
    marginBottom: 20,
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
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
    marginBottom: 20,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  shuffleButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  shuffleText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
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
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
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
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  linkBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
    width: '100%',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
