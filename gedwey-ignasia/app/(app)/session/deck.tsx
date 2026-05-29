import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useSessionHistory } from '../../../lib/queries/sessions';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';

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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4">
          <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
          <View className="mb-4">
            <Skeleton width={180} height={28} className="mb-2" />
            <Skeleton width="100%" height={16} className="mb-1" />
            <Skeleton width="85%" height={16} />
          </View>

          <View className="gap-4">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm">
                <View className="flex-row justify-between items-center mb-3">
                  <Skeleton width={44} height={44} variant="circle" />
                  {i > 2 && <Skeleton width={60} height={20} className="rounded-lg" />}
                </View>
                <Skeleton width={140} height={20} className="mb-2" />
                <Skeleton width="90%" height={14} className="mb-2" />
                <Skeleton width="80%" height={14} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
          <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-text-primary mb-1">Choose a Deck</Text>
          <Text className="text-sm text-text-secondary leading-relaxed mb-6">
            Select a themed prompt for today's shared couple connection.
          </Text>

          <View className="gap-4">
            {DECKS.map((deck) => {
              const isUnlocked = completedSessionsCount >= deck.requiredSessions;
              const progress = Math.min((completedSessionsCount / deck.requiredSessions) * 100, 100);

              return (
                <TouchableOpacity
                  key={deck.key}
                  onPress={() => handleSelectDeck(deck)}
                  activeOpacity={isUnlocked ? 0.7 : 0.85}
                >
                  <Card className={`p-5 ${!isUnlocked ? 'bg-slate-50/50 border-slate-200 opacity-90' : ''}`}>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-4xl">{deck.emoji}</Text>
                      {!isUnlocked && (
                        <View className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                          <Text className="text-2xs font-bold text-primary-600">🔒 Locked</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-lg font-bold text-text-primary mb-1">{deck.title}</Text>
                    <Text className="text-xs text-text-secondary leading-normal mb-1">{deck.desc}</Text>

                    {/* Progress Milestone Bar for Locked Decks */}
                    {!isUnlocked && (
                      <View className="mt-3 border-t border-slate-100 pt-3">
                        <View className="h-1.5 bg-slate-200 rounded-full mb-1.5 overflow-hidden">
                          <View style={{ width: `${progress}%` }} className="h-full bg-primary-600 rounded-full" />
                        </View>
                        <Text className="text-[10px] font-semibold text-text-muted">
                          Milestone: {completedSessionsCount}/{deck.requiredSessions} sessions
                        </Text>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
