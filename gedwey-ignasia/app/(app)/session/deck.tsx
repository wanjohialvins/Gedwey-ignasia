import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useSessionHistory } from '../../../lib/queries/sessions';

interface DeckItem {
  key: 'fun' | 'discovery' | 'intimacy' | 'relationship_health';
  emoji: string;
  title: string;
  desc: string;
  requiredSessions: number;
}

const DECKS: DeckItem[] = [
  {
    key: 'fun',
    emoji: '🎉',
    title: 'Fun & Playful',
    desc: 'Lighthearted and playful questions to make you smile.',
    requiredSessions: 0,
  },
  {
    key: 'discovery',
    emoji: '✨',
    title: 'Discovery',
    desc: 'Explore new angles and get to know each other deeper.',
    requiredSessions: 0,
  },
  {
    key: 'intimacy',
    emoji: '❤️',
    title: 'Deep Intimacy',
    desc: 'Deep, emotionally intimate prompts to build vulnerability.',
    requiredSessions: 3,
  },
  {
    key: 'relationship_health',
    emoji: '🩺',
    title: 'Couple Health',
    desc: 'Check in on your relationship dynamics and alignment.',
    requiredSessions: 10,
  },
];

export default function DeckSelectorScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Fetch profiles and session history to determine completed milestones
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  const { data: sessionHistory, isLoading: historyLoading } = useSessionHistory(coupleId);

  const isLoading = profileLoading || historyLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading card decks...</Text>
      </View>
    );
  }

  const completedSessionsCount = sessionHistory?.length ?? 0;

  const handleSelectDeck = (deck: DeckItem) => {
    const isUnlocked = completedSessionsCount >= deck.requiredSessions;
    
    if (!isUnlocked) {
      Alert.alert(
        'Deck Locked 🔒',
        `This deck is locked. You need to complete ${deck.requiredSessions} sessions to unlock it. Currently completed: ${completedSessionsCount}/${deck.requiredSessions} sessions.`
      );
      return;
    }

    // Go to mood choice and pass deck category
    router.push(`/session/mood?deck=${deck.key}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Choose a Deck</Text>
          <Text style={styles.subtitle}>
            Select a themed prompt for today's shared couple connection.
          </Text>

          <View style={styles.deckList}>
            {DECKS.map((deck) => {
              const isUnlocked = completedSessionsCount >= deck.requiredSessions;
              const progress = Math.min((completedSessionsCount / deck.requiredSessions) * 100, 100);

              return (
                <TouchableOpacity
                  key={deck.key}
                  style={[styles.deckCard, !isUnlocked && styles.deckCardLocked]}
                  onPress={() => handleSelectDeck(deck)}
                  activeOpacity={isUnlocked ? 0.7 : 0.85}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.deckEmoji}>{deck.emoji}</Text>
                    {!isUnlocked && (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeText}>🔒 Locked</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.deckTitle}>{deck.title}</Text>
                  <Text style={styles.deckDesc}>{deck.desc}</Text>

                  {/* Progress Milestone Bar for Locked Decks */}
                  {!isUnlocked && (
                    <View style={styles.milestoneSection}>
                      <View style={styles.barContainer}>
                        <View style={[styles.bar, { width: `${progress}%` }]} />
                      </View>
                      <Text style={styles.milestoneText}>
                        Milestone: {completedSessionsCount}/{deck.requiredSessions} sessions
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  deckList: {
    gap: 16,
  },
  deckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  deckCardLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deckEmoji: {
    fontSize: 36,
  },
  lockBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  deckDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  milestoneSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  barContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  milestoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
