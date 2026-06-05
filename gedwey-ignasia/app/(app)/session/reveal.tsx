import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useActiveSession, useSessionHistory, CoupleSession } from '../../../lib/queries/sessions';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { VoicePlaybackBubble } from '../../../components/VoicePlaybackBubble';
import { formatShortDate } from '../../../lib/dateUtils';

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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
          
          {/* Question Section Skeleton */}
          <View className="bg-white rounded-2xl p-5 border border-neutral-border shadow-sm mb-5">
            <Skeleton width={80} height={14} className="mb-2" />
            <Skeleton width="95%" height={18} className="mb-1" />
            <Skeleton width="60%" height={18} className="mb-3" />
            <Skeleton width={120} height={12} />
          </View>

          {/* Reveal Container / Answer Cards Skeletons */}
          <View className="gap-4 mb-6">
            <View className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100">
                <Skeleton width={80} height={16} />
                <Skeleton width={60} height={20} className="rounded-full" />
              </View>
              <Skeleton width="95%" height={16} className="mb-1" />
              <Skeleton width="80%" height={16} />
            </View>

            <View className="bg-white rounded-2xl p-4 border border-neutral-border shadow-sm">
              <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100">
                <Skeleton width={100} height={16} />
                <Skeleton width={60} height={20} className="rounded-full" />
              </View>
              <Skeleton width="95%" height={16} className="mb-1" />
              <Skeleton width="85%" height={16} />
            </View>
          </View>

          <Skeleton width="100%" height={48} className="rounded-xl" />
        </View>
      </SafeAreaView>
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
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-5xl mb-4">✍️</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">Answer Prompt First</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
              You need to submit your answer to today's question before viewing the reveal.
            </Text>
            <Button
              title="Answer Question"
              onPress={() => router.replace('/session/card')}
              className="w-full"
            />
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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.replace('/')}>
            <Text className="text-primary-600 text-sm font-semibold">← Home</Text>
          </TouchableOpacity>
          <View className="flex-1 justify-center items-center px-6 pb-12">
            <Text className="text-5xl mb-4">🎴</Text>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">No Sessions Yet</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
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
    );
  }

  const isUser1 = sessionToShow.user1_id === user?.id;
  const myAnswer = isUser1 ? sessionToShow.user1_answer : sessionToShow.user2_answer;
  const myMoodKey = isUser1 ? sessionToShow.user1_mood : sessionToShow.user2_mood;
  const myVoiceUrl = isUser1 ? sessionToShow.user1_voice_url : sessionToShow.user2_voice_url;
  const myVoiceDuration = isUser1 ? sessionToShow.user1_voice_duration : sessionToShow.user2_voice_duration;
  const partnerAnswer = isUser1 ? sessionToShow.user2_answer : sessionToShow.user1_answer;
  const partnerMoodKey = isUser1 ? sessionToShow.user2_mood : sessionToShow.user1_mood;
  const partnerVoiceUrl = isUser1 ? sessionToShow.user2_voice_url : sessionToShow.user1_voice_url;
  const partnerVoiceDuration = isUser1 ? sessionToShow.user2_voice_duration : sessionToShow.user1_voice_duration;

  const myMood = MOOD_MAP[myMoodKey || 'neutral'] || MOOD_MAP.neutral;
  const partnerMood = MOOD_MAP[partnerMoodKey || 'neutral'] || MOOD_MAP.neutral;

  const formattedDate = formatShortDate(sessionToShow.completed_at);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.replace('/')}>
          <Text className="text-primary-600 text-sm font-semibold">← Home</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Question Section */}
          <Card className="p-5 mb-5">
            <Text className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">
              Today's Prompt
            </Text>
            <Text className="text-base font-semibold text-text-primary leading-relaxed mb-2">
              {sessionToShow.cards?.text || 'Loading prompt...'}
            </Text>
            {formattedDate ? (
              <Text className="text-2xs text-text-muted">Revealed on {formattedDate}</Text>
            ) : null}
          </Card>

          {isWaitingState ? (
            /* Waiting State */
            <View className="mb-6">
              <View className="flex-row items-center mb-2 px-1">
                <ActivityIndicator size="small" color="#2563EB" className="mr-2" />
                <Text className="text-lg font-bold text-text-primary">Waiting for {partnerName}...</Text>
              </View>
              <Text className="text-sm text-text-secondary leading-relaxed mb-5 px-1">
                We'll notify you as soon as {partnerName} answers. Keep this page open or check back later!
              </Text>

              {/* My Answer Preview */}
              <View className="bg-white rounded-2xl p-5 border border-dashed border-slate-300">
                <Text className="text-xs font-bold text-text-secondary mb-2">Your Response</Text>
                <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-full self-start mb-3 border border-blue-100">
                  <Text className="text-sm mr-1">{myMood.emoji}</Text>
                  <Text className="text-2xs font-bold text-primary-600">{myMood.label}</Text>
                </View>
                <Text className="text-sm text-text-secondary font-medium italic leading-relaxed">{myAnswer}</Text>
                <VoicePlaybackBubble url={myVoiceUrl} duration={myVoiceDuration} />
              </View>
            </View>
          ) : (
            /* Reveal State */
            <View className="gap-4 mb-6">
              {/* My Answer Card */}
              <Card className="p-4 border border-blue-100 shadow-sm">
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <Text className="text-sm font-bold text-text-primary">{myName}</Text>
                  <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    <Text className="text-sm mr-1">{myMood.emoji}</Text>
                    <Text className="text-2xs font-bold text-primary-600">{myMood.label}</Text>
                  </View>
                </View>
                <Text className="text-sm text-text-secondary leading-relaxed">{myAnswer || 'No answer submitted.'}</Text>
                <VoicePlaybackBubble url={myVoiceUrl} duration={myVoiceDuration} />
              </Card>

              {/* Partner Answer Card */}
              <Card className="p-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-100">
                  <Text className="text-sm font-bold text-text-primary">{partnerName}</Text>
                  <View className="flex-row items-center bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    <Text className="text-sm mr-1">{partnerMood.emoji}</Text>
                    <Text className="text-2xs font-bold text-text-secondary">{partnerMood.label}</Text>
                  </View>
                </View>
                <Text className="text-sm text-text-secondary leading-relaxed">{partnerAnswer || 'No answer submitted.'}</Text>
                <VoicePlaybackBubble url={partnerVoiceUrl} duration={partnerVoiceDuration} />
              </Card>

              {/* Celebration Note */}
              <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 items-center mt-2 shadow-sm">
                <Text className="text-2xl mb-2">✨</Text>
                <Text className="text-sm font-bold text-blue-900 text-center mb-1">
                  Intimacy grows in shared moments.
                </Text>
                <Text className="text-xs text-primary-600 text-center leading-relaxed">
                  Take a moment to talk about your answers and connect deeper in real life.
                </Text>
              </View>
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
  );
}
