import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { useCards, Card as CardType } from '../../lib/queries/cards';
import { useCreateDiscoverySession } from '../../lib/queries/discovery';
import { useAuthStore } from '../../lib/store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';

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
const FALLBACK_CARDS: CardType[] = [
  {
    id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    created_at: new Date().toISOString(),
    text: 'What was your very first impression of me, and how has it changed?',
    category: 'discovery',
    min_relationship_stage: null,
  },
  {
    id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    created_at: new Date().toISOString(),
    text: 'What is your idea of a perfect weekend getaway together?',
    category: 'discovery',
    min_relationship_stage: null,
  },
  {
    id: 'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3',
    created_at: new Date().toISOString(),
    text: 'What is one small thing I do that always makes you smile?',
    category: 'discovery',
    min_relationship_stage: null,
  },
];

export default function DiscoveryHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: cards, isLoading: cardsLoading } = useCards('discovery');
  const createSession = useCreateDiscoverySession();

  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
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

      // Generate share link URL (supporting cPanel web URL configured in env)
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
      const link = webUrl 
        ? `${webUrl.replace(/\/$/, '')}/discovery/${token}`
        : Linking.createURL('discovery/' + token);
      setShareLink(link);
      setSessionToken(token);
    } catch (err: any) {
      Alert.alert('Session Creation Failed', err.message || 'Could not create discovery session.');
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert('Link Copied!', 'Share link copied to clipboard. Send it to your partner or guest.');
    }
  };

  if (cardsLoading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16 pb-6">
        {/* Header Skeleton */}
        <View className="mb-6">
          <Skeleton width={100} height={20} className="mb-2" />
          <Skeleton width={180} height={28} className="mb-2" />
          <Skeleton width="100%" height={16} className="mb-1" />
          <Skeleton width="80%" height={16} />
        </View>

        {/* Card prompt Skeleton */}
        <View className="bg-white rounded-2xl p-6 border border-neutral-border shadow-sm mb-5 items-center">
          <Skeleton width={200} height={24} className="mb-4" />
          <Skeleton width={120} height={32} className="rounded-xl" />
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
        {/* Header */}
        <View className="mb-5">
          <TouchableOpacity className="self-start py-1 mb-2" onPress={() => router.replace('/')}>
            <Text className="text-primary-600 text-sm font-semibold">← Home</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary mb-1.5">Discovery Mode</Text>
          <Text className="text-sm text-text-secondary leading-relaxed">
            Break the ice! Answer a question, share your custom link, and unlock their answer together.
          </Text>
        </View>

        {/* Card prompt */}
        {currentCard && (
          <Card className="p-6 mb-5 items-center relative">
            <Text className="text-7xl font-bold text-blue-50/70 absolute top-[-10px] left-4">“</Text>
            <Text className="text-lg font-semibold text-slate-800 text-center leading-relaxed mt-5 mb-4 px-2">
              {currentCard.text}
            </Text>
            <TouchableOpacity 
              className="bg-slate-100 px-4 py-2 rounded-xl active:bg-slate-200" 
              onPress={handleShuffle} 
              activeOpacity={0.7}
            >
              <Text className="text-xs text-text-secondary font-semibold">🔀 Shuffle Question</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Share Link Screen State */}
        {shareLink ? (
          <Card className="p-6 items-center">
            <Text className="text-xl font-bold text-emerald-500 mb-2">🎉 Link Generated!</Text>
            <Text className="text-sm text-text-secondary text-center leading-relaxed mb-5 px-1">
              Your answer has been saved. Share the link below with your partner/guest. Once they answer, both responses will be revealed.
            </Text>

            <View className="w-full bg-background border border-slate-200 rounded-xl p-3 items-center mb-4">
              <Text className="text-sm font-medium text-primary-600 text-center w-full" numberOfLines={1} ellipsizeMode="middle">
                {shareLink}
              </Text>
            </View>

            <Button title="Copy Share Link" onPress={handleCopyLink} className="w-full mb-3" />

            <TouchableOpacity
              className="bg-slate-100 h-12 rounded-xl w-full items-center justify-center active:bg-slate-200"
              onPress={() => router.push(`/discovery/${sessionToken}`)}
              activeOpacity={0.8}
            >
              <Text className="text-text-secondary text-sm font-semibold">Open Guest Screen (Local Test)</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          /* Form Screen State */
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Your Answer</Text>
            <Input
              placeholder="Be honest and expressive..."
              multiline
              numberOfLines={4}
              value={answer}
              onChangeText={setAnswer}
              className="h-28 text-left py-3.5"
            />

            <Button
              title="Generate Share Link"
              onPress={handleGenerateLink}
              disabled={!answer.trim() || createSession.isPending}
              loading={createSession.isPending}
              className="w-full"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
