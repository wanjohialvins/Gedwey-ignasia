import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useActiveSession, useSessionHistory, CoupleSession } from '../../../lib/queries/sessions';

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Happy' },
  grateful: { emoji: '🙏', label: 'Grateful' },
  calm: { emoji: '😌', label: 'Calm' },
  excited: { emoji: '🤩', label: 'Excited' },
  thoughtful: { emoji: '🤔', label: 'Thoughtful' },
  tired: { emoji: '😴', label: 'Tired' },
  anxious: { emoji: '😟', label: 'Anxious' },
  loving: { emoji: '🥰', label: 'Loving' },
  neutral: { emoji: '😐', label: 'Neutral' },
};

export default function SessionRevealScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch current user's profile
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  // Fetch active session and completed session history
  const { data: activeSession, isLoading: activeLoading } = useActiveSession(coupleId);
  const { data: sessionHistory, isLoading: historyLoading } = useSessionHistory(coupleId);

  // Fetch partner profile to get their name
  const partnerId = profile?.partner_id ?? '';
  const { data: partnerProfile, isLoading: partnerLoading } = useUserProfile(partnerId);

  const isLoading = profileLoading || activeLoading || historyLoading || (!!partnerId && partnerLoading);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading session reveal...</Text>
      </View>
    );
  }

  const partnerName = partnerProfile?.display_name || 'Your Partner';
  const myName = profile?.display_name || 'You';

  // Determine which session to show
  // 1. If activeSession exists and current user has answered, we are either waiting or showing reveal
  // 2. If activeSession is null, check if we have any completed session in history
  let sessionToShow: CoupleSession | null = null;
  let isWaitingState = false;

  if (activeSession) {
    const isUser1 = activeSession.user1_id === user?.id;
    const myAnswer = isUser1 ? activeSession.user1_answer : activeSession.user2_answer;
    const partnerAnswer = isUser1 ? activeSession.user2_answer : activeSession.user1_answer;

    if (!myAnswer) {
      // Current user hasn't answered yet! They shouldn't be here, but let's redirect/guide them
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.errorContent}>
              <Text style={styles.errorEmoji}>✍️</Text>
              <Text style={styles.errorTitle}>Answer Prompt First</Text>
              <Text style={styles.errorSubtitle}>
                You need to submit your answer to today's question before viewing the reveal.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/session/card')}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Answer Question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    if (!partnerAnswer) {
      isWaitingState = true;
      sessionToShow = activeSession;
    } else {
      // Both answered but somehow activeSession is still false (rare race condition)
      sessionToShow = activeSession;
    }
  } else if (sessionHistory && sessionHistory.length > 0) {
    // No active session, show the most recent completed one
    sessionToShow = sessionHistory[0];
  }

  if (!sessionToShow) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
            <Text style={styles.backLinkText}>← Home</Text>
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <Text style={styles.errorEmoji}>🎴</Text>
            <Text style={styles.errorTitle}>No Sessions Yet</Text>
            <Text style={styles.errorSubtitle}>
              You haven't completed any sessions together. Start a session from the Home screen to connect!
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/session/start')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Start a Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isUser1 = sessionToShow.user1_id === user?.id;
  const myAnswer = isUser1 ? sessionToShow.user1_answer : sessionToShow.user2_answer;
  const myMoodKey = isUser1 ? sessionToShow.user1_mood : sessionToShow.user2_mood;
  const partnerAnswer = isUser1 ? sessionToShow.user2_answer : sessionToShow.user1_answer;
  const partnerMoodKey = isUser1 ? sessionToShow.user2_mood : sessionToShow.user1_mood;

  const myMood = MOOD_MAP[myMoodKey || 'neutral'] || MOOD_MAP.neutral;
  const partnerMood = MOOD_MAP[partnerMoodKey || 'neutral'] || MOOD_MAP.neutral;

  const formattedDate = sessionToShow.completed_at
    ? new Date(sessionToShow.completed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
          <Text style={styles.backLinkText}>← Home</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Question Section */}
          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>Today's Prompt</Text>
            <Text style={styles.promptText}>{sessionToShow.cards?.text || 'Loading prompt...'}</Text>
            {formattedDate ? <Text style={styles.dateText}>Revealed on {formattedDate}</Text> : null}
          </View>

          {isWaitingState ? (
            /* Waiting State */
            <View style={styles.waitingContainer}>
              <View style={styles.waitingHeader}>
                <ActivityIndicator size="small" color="#2563EB" style={styles.waitingIndicator} />
                <Text style={styles.waitingTitle}>Waiting for {partnerName}...</Text>
              </View>
              <Text style={styles.waitingSubtitle}>
                We'll notify you as soon as {partnerName} answers. Keep this page open or check back later!
              </Text>

              {/* My Answer Preview */}
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Your Response</Text>
                <View style={styles.moodBadge}>
                  <Text style={styles.moodEmoji}>{myMood.emoji}</Text>
                  <Text style={styles.moodLabel}>{myMood.label}</Text>
                </View>
                <Text style={styles.previewText}>{myAnswer}</Text>
              </View>
            </View>
          ) : (
            /* Reveal State */
            <View style={styles.revealContainer}>
              {/* My Answer Card */}
              <View style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <Text style={styles.userName}>{myName}</Text>
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodEmoji}>{myMood.emoji}</Text>
                    <Text style={styles.moodLabel}>{myMood.label}</Text>
                  </View>
                </View>
                <Text style={styles.answerText}>{myAnswer || 'No answer submitted.'}</Text>
              </View>

              {/* Partner Answer Card */}
              <View style={styles.answerCardPartner}>
                <View style={styles.answerHeader}>
                  <Text style={styles.userName}>{partnerName}</Text>
                  <View style={styles.moodBadgePartner}>
                    <Text style={styles.moodEmoji}>{partnerMood.emoji}</Text>
                    <Text style={styles.moodLabelPartner}>{partnerMood.label}</Text>
                  </View>
                </View>
                <Text style={styles.answerText}>{partnerAnswer || 'No answer submitted.'}</Text>
              </View>

              {/* Celebration Note */}
              <View style={styles.celebrationCard}>
                <Text style={styles.celebrationEmoji}>✨</Text>
                <Text style={styles.celebrationTitle}>Intimacy grows in shared moments.</Text>
                <Text style={styles.celebrationSubtitle}>
                  Take a moment to talk about your answers and connect deeper in real life.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
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
    paddingTop: 10,
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
  promptCard: {
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
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  waitingContainer: {
    marginBottom: 24,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  waitingIndicator: {
    marginRight: 8,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  waitingSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  revealContainer: {
    gap: 16,
    marginBottom: 24,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  answerCardPartner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moodBadgePartner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moodEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  moodLabelPartner: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  answerText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  celebrationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  celebrationEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  celebrationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 12,
    color: '#2563EB',
    textAlign: 'center',
    lineHeight: 18,
  },
  homeButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  errorEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
