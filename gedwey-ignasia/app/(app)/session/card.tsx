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
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { Card as CardType } from '../../../lib/queries/cards';
import { useActiveSession, useCreateSession, useSubmitSessionAnswer, useDailyQuestion } from '../../../lib/queries/sessions';
import { scheduleLocalNotification, NOTIFICATION_CHANNELS } from '../../../lib/notifications';
import { userWantsSessionReminders, getUserPreferences } from '../../../lib/notificationPrefs';
import { playSoundscape, stopSoundscape, isSoundscapePlaying } from '../../../lib/soundscapePlayer';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { VoiceNoteRecorder } from '../../../components/VoiceNoteRecorder';
import { AppIcon } from '../../../components/AppIcon';

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'vulnerable', emoji: '🥺', label: 'Vulnerable' },
  { id: 'calming', emoji: '🧘', label: 'Calm' },
  { id: 'playful', emoji: '🤪', label: 'Playful' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
];

export default function SessionCardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  
  const { data: activeSession, isLoading: sessionLoading } = useActiveSession(coupleId);
  const { data: dailyCard, isLoading: dailyCardLoading } = useDailyQuestion(coupleId);
  
  const createSession = useCreateSession();
  const submitAnswer = useSubmitSessionAnswer();

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [selectedMood, setSelectedMood] = useState('calming');
  const [answer, setAnswer] = useState('');
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // If there's an active session, use that card. Otherwise use the daily card.
  useEffect(() => {
    if (activeSession?.cards) {
      setSelectedCard(activeSession.cards);
    } else if (dailyCard) {
      setSelectedCard(dailyCard);
    }
  }, [activeSession, dailyCard]);

  // Handle ambient loop playback
  useEffect(() => {
    if (!profile) return;
    const checkSoundscape = async () => {
      try {
        const playing = await isSoundscapePlaying();
        setIsMusicPlaying(playing);
        
        // Auto-play on mount if user preferences allow
        const prefs = getUserPreferences(profile);
        if (prefs.soundscapeEnabled && !playing) {
          await playSoundscape(prefs.selectedSound || 'acoustic');
          setIsMusicPlaying(true);
        }
      } catch (err) {
        console.log('[SessionCard] Soundscape check failed:', err);
      }
    };
    checkSoundscape();

    return () => {
      stopSoundscape().catch(() => {});
    };
  }, [profile?.id, profile?.preferences]);

  const toggleMusic = async () => {
    try {
      const playing = await isSoundscapePlaying();
      if (playing) {
        await stopSoundscape();
        setIsMusicPlaying(false);
      } else {
        const prefs = getUserPreferences(profile);
        await playSoundscape(prefs.selectedSound || 'acoustic');
        setIsMusicPlaying(true);
      }
    } catch (err) {
      console.warn('[SessionCard] Toggle soundscape failed:', err);
    }
  };

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
            mood: selectedMood,
          })
        ).id;

      await submitAnswer.mutateAsync({
        sessionId,
        coupleId: profile.couple_id,
        userId: user.id,
        answer: answer.trim() || 'Voice note response',
        mood: selectedMood,
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

  const isLoading = sessionLoading || dailyCardLoading;
  const isPending = createSession.isPending || submitAnswer.isPending;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16 pb-6">
        <Skeleton width={80} height={20} className="mb-4 py-1" />
        <View className="bg-white rounded-2xl p-6 border border-neutral-border shadow-sm mb-6 items-center">
          <Skeleton width="90%" height={24} className="mb-2" />
          <Skeleton width="60%" height={24} />
        </View>

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
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity className="py-1" onPress={() => router.replace('/')}>
            <Text className="text-primary-600 text-sm font-semibold">← Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleMusic} 
            className={`w-10 h-10 rounded-full items-center justify-center border ${isMusicPlaying ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}
          >
            <AppIcon 
              name={isMusicPlaying ? "musical-notes" : "musical-notes-outline"} 
              size={20} 
              color={isMusicPlaying ? "#4F46E5" : "#64748B"} 
            />
          </TouchableOpacity>
        </View>

        {/* Question card */}
        {selectedCard ? (
          <Card className="p-6 mb-6 items-center relative border border-blue-50/80 shadow-sm bg-white">
            <Text className="text-7xl font-bold text-blue-50/70 absolute top-[-10px] left-4">“</Text>
            <Text className="text-lg font-semibold text-slate-800 text-center leading-relaxed mt-5 px-2">
              {selectedCard.text}
            </Text>
          </Card>
        ) : (
          <Card className="p-6 mb-6 items-center bg-slate-50 border-slate-200">
            <Text className="text-sm text-text-secondary text-center">No question available for today. Check back later!</Text>
          </Card>
        )}

        {/* Answering Form */}
        <View className="flex-1">
          {/* Mood Selector (Interactive Row) */}
          <Text className="text-sm font-semibold text-slate-700 mb-2">How are you feeling right now?</Text>
          <View className="flex-row justify-between mb-5 bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
            {MOODS.map((mood) => {
              const selected = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                  className={`flex-1 py-2 mx-0.5 rounded-xl items-center ${selected ? 'bg-indigo-600 shadow-sm' : 'bg-transparent'}`}
                >
                  <Text className="text-xl mb-0.5">{mood.emoji}</Text>
                  <Text className={`text-[9px] font-bold ${selected ? 'text-white' : 'text-slate-500'}`}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-sm font-semibold text-slate-700 mb-2">Your Answer</Text>
          <Input
            placeholder="Be open, honest, and vulnerable..."
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
