import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useActiveSession, useSessionHistory, useSession, CoupleSession } from '../../../lib/queries/sessions';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { ScreenShell } from '../../../components/ScreenShell';
import { VoicePlaybackBubble } from '../../../components/VoicePlaybackBubble';
import { formatShortDate } from '../../../lib/dateUtils';
import { useTheme } from '../../../lib/hooks/useTheme';

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
  const { theme, isDark } = useTheme();

  const { id } = useLocalSearchParams<{ id?: string }>();

  // Fetch current user's profile
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  // Fetch active session and completed session history
  const { data: activeSession, isLoading: activeLoading } = useActiveSession(coupleId);
  const { data: sessionHistory, isLoading: historyLoading } = useSessionHistory(coupleId);
  const { data: specificSession, isLoading: specificLoading } = useSession(id ?? '');

  // Fetch partner profile to get their name
  const partnerId = profile?.partner_id ?? '';
  const { data: partnerProfile, isLoading: partnerLoading } = useUserProfile(partnerId);

  const isLoading = profileLoading || activeLoading || historyLoading || (!!partnerId && partnerLoading) || (!!id && specificLoading);

  if (isLoading) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
            
            {/* Question Section Skeleton */}
            <Card className="p-5 mb-5">
              <Skeleton width={80} height={14} className="mb-2" />
              <Skeleton width="95%" height={18} className="mb-1" />
              <Skeleton width="60%" height={18} className="mb-3" />
              <Skeleton width={120} height={12} />
            </Card>

            {/* Reveal Container / Answer Cards Skeletons */}
            <View className="gap-4 mb-6">
              <Card className="p-4 border shadow-sm">
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <Skeleton width={80} height={16} />
                  <Skeleton width={60} height={20} className="rounded-full" />
                </View>
                <Skeleton width="95%" height={16} className="mb-1" />
                <Skeleton width="80%" height={16} />
              </Card>

              <Card className="p-4 border shadow-sm">
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <Skeleton width={100} height={16} />
                  <Skeleton width={60} height={20} className="rounded-full" />
                </View>
                <Skeleton width="95%" height={16} className="mb-1" />
                <Skeleton width="85%" height={16} />
              </Card>
            </View>

            <Skeleton width="100%" height={48} className="rounded-xl" />
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const partnerName = partnerProfile?.display_name || 'Your Partner';
  const myName = profile?.display_name || 'You';

  // Determine which session to show
  let sessionToShow: CoupleSession | null = null;
  let isWaitingState = false;

  if (id) {
    if (specificSession) {
      const isUser1 = specificSession.user1_id === user?.id;
      const myAnswer = isUser1 ? specificSession.user1_answer : specificSession.user2_answer;
      const partnerAnswer = isUser1 ? specificSession.user2_answer : specificSession.user1_answer;

      if (!myAnswer) {
        return (
          <ScreenShell className="flex-1">
            <SafeAreaView className="flex-1">
              <View className="flex-1 justify-center items-center px-6">
                <Text className="text-5xl mb-4">✍️</Text>
                <Text className="text-xl font-bold text-text-primary mb-2 text-center" style={{ color: theme.textPrimary }}>Answer Prompt First</Text>
                <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4" style={{ color: theme.textSecondary }}>
                  You need to submit your answer to this question before viewing the reveal.
                </Text>
                <Button
                  title="Answer Question"
                  onPress={() => router.replace(`/session/card?id=${id}`)}
                  className="w-full"
                />
              </View>
            </SafeAreaView>
          </ScreenShell>
        );
      }

      if (!partnerAnswer) {
        isWaitingState = true;
        sessionToShow = specificSession;
      } else {
        sessionToShow = specificSession;
      }
    }
  } else if (activeSession) {
    const isUser1 = activeSession.user1_id === user?.id;
    const myAnswer = isUser1 ? activeSession.user1_answer : activeSession.user2_answer;
    const partnerAnswer = isUser1 ? activeSession.user2_answer : activeSession.user1_answer;

    if (!myAnswer) {
      return (
        <ScreenShell className="flex-1">
          <SafeAreaView className="flex-1">
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-5xl mb-4">✍️</Text>
              <Text className="text-xl font-bold text-text-primary mb-2 text-center" style={{ color: theme.textPrimary }}>Answer Prompt First</Text>
              <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4" style={{ color: theme.textSecondary }}>
                You need to submit your answer to today's question before viewing the reveal.
              </Text>
              <Button
                title="Answer Question"
                onPress={() => router.replace('/session/card')}
                className="w-full"
              />
            </View>
          </SafeAreaView>
        </ScreenShell>
      );
    }

    if (!partnerAnswer) {
      isWaitingState = true;
      sessionToShow = activeSession;
    } else {
      sessionToShow = activeSession;
    }
  } else if (sessionHistory && sessionHistory.length > 0) {
    sessionToShow = sessionHistory[0];
  }

  if (!sessionToShow) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.replace('/')}>
              <Text style={{ color: theme.accent }} className="text-sm font-semibold">← Home</Text>
            </TouchableOpacity>
            <View className="flex-1 justify-center items-center px-6 pb-12">
              <Text className="text-5xl mb-4">🎴</Text>
              <Text className="text-xl font-bold text-text-primary mb-2 text-center" style={{ color: theme.textPrimary }}>No Sessions Yet</Text>
              <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4" style={{ color: theme.textSecondary }}>
                You haven't completed any sessions together. Start a session from the Home screen to connect!
              </Text>
              <Button
                title="Start a Session"
                onPress={() => router.replace('/session/start')}
                className="w-full"
              />
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const isUser1 = sessionToShow.user1_id === user?.id;
  const myAnswer = isUser1 ? sessionToShow.user1_answer : sessionToShow.user2_answer;
  const myMoodKey = isUser1 ? sessionToShow.user1_mood : sessionToShow.user2_mood;
  const myVoiceUrl = isUser1 ? sessionToShow.user1_voice_url : sessionToShow.user2_voice_url;
  const myVoiceDuration = isUser1 ? sessionToShow.user1_voice_duration : sessionToShow.user2_voice_duration;
  const partnerAnswer = isUser1 ? sessionToShow.user2_answer : sessionToShow.user2_answer;
  const partnerMoodKey = isUser1 ? sessionToShow.user2_mood : sessionToShow.user1_mood;
  const partnerVoiceUrl = isUser1 ? sessionToShow.user2_voice_url : sessionToShow.user1_voice_url;
  const partnerVoiceDuration = isUser1 ? sessionToShow.user2_voice_duration : sessionToShow.user1_voice_duration;

  const myMood = MOOD_MAP[myMoodKey || 'neutral'] || MOOD_MAP.neutral;
  const partnerMood = MOOD_MAP[partnerMoodKey || 'neutral'] || MOOD_MAP.neutral;

  const formattedDate = formatShortDate(sessionToShow.completed_at);

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.replace('/')}>
            <Text style={{ color: theme.accent }} className="text-sm font-semibold">← Home</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Question Section */}
            <Card className="p-5 mb-5">
              <Text className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                Today's Prompt
              </Text>
              <Text className="text-base font-semibold text-text-primary leading-relaxed mb-2" style={{ color: theme.textPrimary }}>
                {sessionToShow.cards?.text || 'Loading prompt...'}
              </Text>
              {formattedDate ? (
                <Text className="text-2xs text-text-muted" style={{ color: theme.textTertiary }}>Revealed on {formattedDate}</Text>
              ) : null}
            </Card>

            {isWaitingState ? (
              /* Waiting State */
              <View className="mb-6">
                <View className="flex-row items-center mb-2 px-1">
                  <ActivityIndicator size="small" color={theme.accent} className="mr-2" />
                  <Text className="text-lg font-bold text-text-primary" style={{ color: theme.textPrimary }}>Waiting for {partnerName}...</Text>
                </View>
                <Text className="text-sm text-text-secondary leading-relaxed mb-5 px-1" style={{ color: theme.textSecondary }}>
                  We'll notify you as soon as {partnerName} answers. Keep this page open or check back later!
                </Text>

                {/* My Answer Preview */}
                <Card glass className="p-5 border border-dashed border-slate-300">
                  <Text className="text-xs font-bold text-text-secondary mb-2" style={{ color: theme.textSecondary }}>Your Response</Text>
                  <View className="flex-row items-center bg-blue-50/20 px-2.5 py-1 rounded-full self-start mb-3 border border-blue-100/30">
                    <Text className="text-sm mr-1">{myMood.emoji}</Text>
                    <Text className="text-2xs font-bold text-primary-600" style={{ color: theme.accent }}>{myMood.label}</Text>
                  </View>
                  <Text className="text-sm text-text-secondary font-medium italic leading-relaxed" style={{ color: theme.textSecondary }}>{myAnswer}</Text>
                  <VoicePlaybackBubble url={myVoiceUrl} duration={myVoiceDuration} />
                </Card>
              </View>
            ) : (
              /* Reveal State */
              <View className="gap-4 mb-6">
                {/* My Answer Card */}
                <Card className="p-4 border border-blue-100/30 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100/10">
                    <Text className="text-sm font-bold text-text-primary" style={{ color: theme.textPrimary }}>{myName}</Text>
                    <View className="flex-row items-center bg-blue-50/20 px-2.5 py-1 rounded-full border border-blue-100/30">
                      <Text className="text-sm mr-1">{myMood.emoji}</Text>
                      <Text className="text-2xs font-bold text-primary-600" style={{ color: theme.accent }}>{myMood.label}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-text-secondary leading-relaxed" style={{ color: theme.textSecondary }}>{myAnswer || 'No answer submitted.'}</Text>
                  <VoicePlaybackBubble url={myVoiceUrl} duration={myVoiceDuration} />
                </Card>

                {/* Partner Answer Card */}
                <Card className="p-4 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100/10">
                    <Text className="text-sm font-bold text-text-primary" style={{ color: theme.textPrimary }}>{partnerName}</Text>
                    <View className="flex-row items-center bg-slate-50/20 px-2.5 py-1 rounded-full border border-slate-200/30">
                      <Text className="text-sm mr-1">{partnerMood.emoji}</Text>
                      <Text className="text-2xs font-bold text-text-secondary" style={{ color: theme.textSecondary }}>{partnerMood.label}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-text-secondary leading-relaxed" style={{ color: theme.textSecondary }}>{partnerAnswer || 'No answer submitted.'}</Text>
                  <VoicePlaybackBubble url={partnerVoiceUrl} duration={partnerVoiceDuration} />
                </Card>

                {/* Celebration Note */}
                <Card 
                  glass 
                  className="p-4 items-center mt-2 border shadow-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(79, 70, 229, 0.12)' : 'rgba(79, 70, 229, 0.06)',
                    borderColor: isDark ? 'rgba(79, 70, 229, 0.25)' : 'rgba(79, 70, 229, 0.15)',
                  }}
                >
                  <Text className="text-2xl mb-2">✨</Text>
                  <Text className="text-sm font-bold text-center mb-1" style={{ color: theme.textPrimary }}>
                    Intimacy grows in shared moments.
                  </Text>
                  <Text className="text-xs text-center leading-relaxed" style={{ color: theme.accent }}>
                    Take a moment to talk about your answers and connect deeper in real life.
                  </Text>
                </Card>
              </View>
            )}

            <Button
              title="Back to Dashboard"
              onPress={() => router.replace('/')}
              className="w-full mt-2"
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}
