import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCards, Card as CardType } from '../../../lib/queries/cards';
import { useActiveSession, useCreateSession, useSubmitSessionAnswer } from '../../../lib/queries/sessions';
import { scheduleLocalNotification, NOTIFICATION_CHANNELS } from '../../../lib/notifications';
import { userWantsSessionReminders } from '../../../lib/notificationPrefs';
import { useSessionSoundscape } from '../../../lib/hooks/useSessionSoundscape';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { VoiceNoteRecorder } from '../../../components/VoiceNoteRecorder';

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
  useSessionSoundscape(profile);

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [answer, setAnswer] = useState('');
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number | null>(null);
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
    if (!answer.trim() && !voiceUrl) {
      Alert.alert('Answer Required', 'Please write your answer or attach a voice note.');
      return;
    }
    if (!user || !profile?.couple_id || !selectedCard) return;

    try {
      const sessionId =
        activeSession?.id ??
        (
          await createSession.mutateAsync({
            coupleId: profile.couple_id,
            cardId: selectedCard.id,
            userId: user.id,
            mood: mood || 'neutral',
          })
        ).id;

      await submitAnswer.mutateAsync({
        sessionId,
        coupleId: profile.couple_id,
        userId: user.id,
        answer: answer.trim() || 'Voice note response',
        mood: mood || undefined,
        voiceUrl: voiceUrl || undefined,
        voiceDuration: voiceDuration || undefined,
      });

      if (userWantsSessionReminders(profile)) {
        await scheduleLocalNotification(
          'Daily Check-in Reminder 🎴',
          'It has been 24 hours since your last session. Connect with your partner today!',
          86400,
          {
            identifier: 'daily_session_reminder',
            channelId: NOTIFICATION_CHANNELS.sessions,
            data: { type: 'session_reminder' },
          }
        );
      }

      router.replace('/session/reveal');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit your answer.');
    }
  };

  const isLoading = sessionLoading || cardsLoading;
  const isPending = createSession.isPending || submitAnswer.isPending;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16 pb-6">
        <Skeleton width={80} height={20} className="mb-4 py-1" />
        {/* Question card Skeleton */}
        <View className="bg-white rounded-2xl p-6 border border-neutral-border shadow-sm mb-6 items-center">
          <Skeleton width="90%" height={24} className="mb-2" />
          <Skeleton width="60%" height={24} />
        </View>

        {/* Form Skeleton */}
        <View className="flex-1 gap-4">
          <Skeleton width={100} height={16} />
          <Skeleton width="100%" height={120} className="rounded-2xl" />
          <Skeleton width="100%" height={48} className="rounded-xl" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 24 }}>
        <TouchableOpacity className="self-start py-1 mb-4" onPress={() => router.back()}>
          <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
        </TouchableOpacity>

        {/* Question card */}
        {selectedCard && (
          <Card className="p-6 mb-6 items-center relative">
            <Text className="text-7xl font-bold text-blue-50/70 absolute top-[-10px] left-4">“</Text>
            <Text className="text-lg font-semibold text-slate-800 text-center leading-relaxed mt-5 px-2">
              {selectedCard.text}
            </Text>
          </Card>
        )}

        {/* Answer input */}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-700 mb-2">Your Answer</Text>
          <Input
            placeholder="Be open and honest..."
            multiline
            numberOfLines={5}
            value={answer}
            onChangeText={setAnswer}
            className="h-32 text-left py-3.5"
          />

          <VoiceNoteRecorder
            userId={user?.id}
            onUploaded={(url, duration) => {
              setVoiceUrl(url);
              setVoiceDuration(duration);
            }}
          />

          <Button
            title="Submit Answer"
            onPress={handleSubmit}
            disabled={(!answer.trim() && !voiceUrl) || isPending}
            loading={isPending}
            className="w-full mt-2"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
