import React, { useState } from 'react';
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
import { useCreateCard } from '../../../lib/queries/cards';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { ScreenShell } from '../../../components/ScreenShell';

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

  // Custom Prompt Creation States
  const createCard = useCreateCard();
  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState<'fun' | 'discovery' | 'intimacy' | 'relationship_health'>('discovery');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const isLoading = profileLoading || historyLoading;

  const handleSelectDeck = (deck: DeckItem) => {
    const completedSessionsCount = sessionHistory?.length ?? 0;
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

  const handleCreatePrompt = async () => {
    if (!customText.trim()) {
      Alert.alert('Validation Error', 'Please type your custom question text.');
      return;
    }

    setIsSubmittingCard(true);
    try {
      await createCard.mutateAsync({
        text: customText.trim(),
        category: customCategory,
        min_relationship_stage: null,
      });
      Alert.alert(
        'Prompt Created! ✍️',
        `Your custom prompt has been successfully added to the "${customCategory.replace('_', ' ')}" deck.`
      );
      setCustomText('');
    } catch (err: any) {
      Alert.alert(
        'Creation Failed',
        err.message || 'Could not insert custom card. Please check if RLS insert policy is enabled.'
      );
    } finally {
      setIsSubmittingCard(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
            <View className="mb-4">
              <Skeleton width={180} height={28} className="mb-2" />
              <Skeleton width="100%" height={16} className="mb-1" />
              <Skeleton width="85%" height={16} />
            </View>

            <View className="gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5">
                  <View className="flex-row justify-between items-center mb-3">
                    <Skeleton width={44} height={44} variant="circle" />
                    {i > 2 && <Skeleton width={60} height={20} className="rounded-lg" />}
                  </View>
                  <Skeleton width={140} height={20} className="mb-2" />
                  <Skeleton width="90%" height={14} className="mb-2" />
                  <Skeleton width="80%" height={14} />
                </Card>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const completedSessionsCount = sessionHistory?.length ?? 0;

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
            <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-text-primary mb-1">Choose a Deck</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-6">
              Select a themed prompt for today's shared couple connection.
            </Text>

            <View className="gap-4 mb-8">
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

            {/* Premium Custom Card Creation Widget */}
            <Card className="p-5 border border-primary-100 bg-blue-50/5">
              <Text className="text-base font-bold text-text-primary mb-3">✍️ Write a Custom Prompt</Text>
              <Text className="text-xs text-text-secondary leading-normal mb-4">
                Add your own custom question cards to the pool. They will be immediately integrated into the active decks!
              </Text>
              
              <Input
                label="Your Question"
                placeholder="e.g. What is a habit of mine you secretly adore?"
                value={customText}
                onChangeText={setCustomText}
              />

              <Text className="text-xs font-semibold text-text-secondary mt-3 mb-1.5">Deck Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {['discovery', 'fun', 'intimacy', 'relationship_health'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCustomCategory(cat as any)}
                    className={`px-3 py-2 rounded-xl border capitalize ${
                      customCategory === cat
                        ? 'bg-primary-100 border-primary-600'
                        : 'bg-white border-neutral-border'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        customCategory === cat ? 'text-primary-600' : 'text-text-secondary'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Add Custom Prompt"
                onPress={handleCreatePrompt}
                loading={isSubmittingCard}
                className="w-full"
              />
            </Card>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}
