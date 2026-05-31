import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DevBadge } from '../../components/DevBadge';
import { AppIcon } from '../../components/AppIcon';
import { GamePromptCard } from '../../components/GamePromptCard';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ScreenShell } from '../../components/ScreenShell';
import { broadcastLiveActivity } from '../../components/LivePartnerWidget';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { CATEGORY_LABELS, GAME_MODES, GameMode } from '../../lib/gamePrompts';
import { DEV_MODE } from '../../lib/devMode';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import { useLogActivity } from '../../lib/queries/engagement';
import { useGameCards } from '../../lib/queries/gameCards';
import { useGameAnswers, useSubmitGameAnswer } from '../../lib/queries/gameAnswers';
import { useNetworkStore } from '../../lib/networkStatus';

export default function GamesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile } = useUserProfile(profile?.partner_id ?? '');
  const logActivity = useLogActivity();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const [mode, setMode] = useState<GameMode>('truth_or_dare');
  const [category, setCategory] = useState<'all' | 'fun' | 'deep' | 'playful' | 'mature'>('all');
  const [matureConfirmed, setMatureConfirmed] = useState(false);
  const [truthOrDareChoice, setTruthOrDareChoice] = useState<'truth' | 'dare' | 'any'>('any');
  const [index, setIndex] = useState(0);
  const [cardKey, setCardKey] = useState('0');
  const [myAnswer, setMyAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<'a' | 'b' | null>(null);

  const submitGameAnswer = useSubmitGameAnswer();
  const { data: allGameAnswers = [] } = useGameAnswers(profile?.couple_id ?? '');

  const matureReady = !!profile?.mature_mode_enabled && (!profile?.partner_id || !!partnerProfile?.mature_mode_enabled);

  const { data: cards = [], isLoading: cardsLoading, refetch } = useGameCards(mode, category, {
    matureEnabled: matureReady,
    matureConfirmed: category === 'mature' ? matureConfirmed : true,
    truthOrDareChoice: mode === 'truth_or_dare' ? truthOrDareChoice : 'any',
  });

  const prompt = cards[index % Math.max(cards.length, 1)];

  const promptAnswers = prompt
    ? allGameAnswers.filter((a) => a.prompt === prompt.prompt && a.game_type === mode)
    : [];

  const mySaved = promptAnswers.find((a) => a.user_id === user?.id);
  const partnerSaved = promptAnswers.find((a) => a.user_id !== user?.id);

  useEffect(() => {
    setMyAnswer('');
    setSelectedChoice(null);
  }, [prompt?.id, cardKey]);

  useEffect(() => {
    if (!cards.length) {
      setIndex(0);
      return;
    }
    const next = Math.floor(Math.random() * cards.length);
    setIndex(next);
    setCardKey(`${mode}-${category}-${cards[next]?.id ?? next}-${Date.now()}`);
  }, [mode, category, matureConfirmed, truthOrDareChoice, cards.length]);

  const nextPrompt = async () => {
    if (!cards.length) return;
    setIndex((current) => {
      if (cards.length === 1) return 0;
      let next = current;
      while (next === current) {
        next = Math.floor(Math.random() * cards.length);
      }
      setCardKey(`${mode}-${category}-${cards[next]?.id ?? next}-${Date.now()}`);
      return next;
    });
    if (profile?.couple_id && user?.id) {
      await logActivity.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        activityType: 'game',
        title: `Played ${GAME_MODES.find((item) => item.id === mode)?.title}`,
        metadata: { mode, category, truthOrDareChoice },
      });
      broadcastLiveActivity(profile.couple_id, user.id, 'Playing', GAME_MODES.find((item) => item.id === mode)?.title || 'a game');
    }
  };

  const submitAnswer = async () => {
    if (!profile?.couple_id || !user?.id || !prompt) {
      Alert.alert('Pair first', 'Connect with your partner to save shared game answers.');
      return;
    }

    let answerText = myAnswer.trim();
    if (prompt.option_a && prompt.option_b) {
      if (!selectedChoice) {
        Alert.alert('Pick an option', 'Choose option A or B before submitting.');
        return;
      }
      answerText = selectedChoice === 'a' ? prompt.option_a : prompt.option_b;
    }
    if (!answerText) {
      Alert.alert('Answer required', 'Type your answer or pick an option.');
      return;
    }

    try {
      await submitGameAnswer.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        gameType: mode,
        category,
        promptText: prompt.prompt,
        answerText,
        optionChosen: selectedChoice ? (selectedChoice === 'a' ? prompt.option_a! : prompt.option_b!) : undefined,
        gameCardId: prompt.id,
      });
      await logActivity.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        activityType: 'game',
        title: `Answered: ${GAME_MODES.find((item) => item.id === mode)?.title}`,
        metadata: { mode, category, promptId: prompt.id },
      });
      broadcastLiveActivity(profile.couple_id, user.id, 'Answered', 'a game prompt');
      setMyAnswer('');
      setSelectedChoice(null);
      Alert.alert('Saved', 'Your answer is visible to your partner.');
    } catch (err: unknown) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Try again.');
    }
  };

  const enableMature = () => {
    if (!profile?.mature_mode_enabled) {
      Alert.alert('Enable in Settings', 'Turn on Mature Mode in Settings and confirm you are 18+ first.');
      return;
    }
    if (profile?.partner_id && !partnerProfile?.mature_mode_enabled) {
      Alert.alert(
        'Waiting for Partner',
        `${partnerProfile?.display_name || 'Your partner'} also needs to enable Mature Mode on their device.`
      );
      return;
    }
    Alert.alert('Spicy Mode', 'Optional, age-restricted prompts for respectful intimacy.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'I am 18+', onPress: () => setMatureConfirmed(true) },
    ]);
  };

  return (
    <ScreenShell variant="hero" className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => router.back()} className="bg-indigo-100 px-3 py-2 rounded-xl flex-row items-center gap-1">
            <AppIcon name="arrow-back" size={16} color="#4F46E5" />
            <Text className="text-sm font-bold text-indigo-600">Back</Text>
          </TouchableOpacity>
          <View className="items-center flex-row gap-2">
            <AppIcon name={NAV_ICONS.playActive} size={22} color="#4F46E5" />
            <Text className="text-xl font-bold text-text-primary">Play</Text>
            <DevBadge />
          </View>
          <TouchableOpacity onPress={() => router.push('/answers')} className="bg-indigo-100 px-2 py-2 rounded-xl">
            <Text className="text-[10px] font-bold text-indigo-600">Answers</Text>
          </TouchableOpacity>
        </View>

        {DEV_MODE && category === 'mature' ? (
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            <Text className="text-xs text-amber-800">Dev mode — age gate bypassed for testing.</Text>
          </View>
        ) : null}

        {!isOnline ? (
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            <Text className="text-xs text-amber-900 text-center">Offline — using saved or built-in prompts</Text>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {GAME_MODES.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setMode(item.id)}
              className={`w-[170px] mr-3 rounded-2xl border p-4 ${mode === item.id ? 'bg-primary-600 border-primary-600' : 'bg-white border-neutral-border'}`}
            >
              <Text className={`text-sm font-bold mb-1 ${mode === item.id ? 'text-white' : 'text-text-primary'}`}>{item.title}</Text>
              <Text className={`text-xs leading-normal ${mode === item.id ? 'text-blue-100' : 'text-text-secondary'}`}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {mode === 'truth_or_dare' ? (
          <View className="flex-row gap-2 mb-4">
            {(['any', 'truth', 'dare'] as const).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTruthOrDareChoice(item)}
                className={`flex-1 py-2.5 rounded-xl border items-center ${truthOrDareChoice === item ? 'bg-primary-600 border-primary-600' : 'bg-white border-neutral-border'}`}
              >
                <Text className={`text-xs font-bold capitalize ${truthOrDareChoice === item ? 'text-white' : 'text-text-secondary'}`}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-2 mb-5">
          {(['all', 'fun', 'deep', 'playful', 'mature'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                if (item === 'mature') {
                  if (!matureConfirmed) enableMature();
                  setCategory(item);
                  return;
                }
                setCategory(item);
              }}
              className={`px-3 py-2 rounded-xl border ${category === item ? 'bg-blue-50 border-primary-600' : 'bg-white border-neutral-border'}`}
            >
              <Text className={`text-xs font-bold ${category === item ? 'text-primary-600' : 'text-text-secondary'}`}>
                {item === 'all' ? 'All' : CATEGORY_LABELS[item]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {cardsLoading ? (
          <View className="min-h-[260px] items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : cards.length === 0 ? (
          <View className="min-h-[200px] items-center justify-center bg-white rounded-2xl border border-dashed border-indigo-200 p-6">
            <Text className="text-sm text-text-secondary text-center mb-4">Run game card SQL seeds in Supabase, then retry.</Text>
            <Button title="Retry" onPress={() => refetch()} variant="secondary" />
          </View>
        ) : (
          <>
            <GamePromptCard card={prompt ?? null} mode={mode} cardKey={cardKey} />

            <Card className="p-5 mt-4 border border-indigo-100">
              <Text className="text-sm font-bold text-text-primary mb-3">Your answer</Text>
              {prompt?.option_a && prompt?.option_b ? (
                <View className="flex-row gap-2 mb-3">
                  {(['a', 'b'] as const).map((key) => {
                    const label = key === 'a' ? prompt.option_a! : prompt.option_b!;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedChoice(key)}
                        className={`flex-1 py-3 px-2 rounded-xl border ${selectedChoice === key ? 'bg-primary-600 border-primary-600' : 'bg-white border-neutral-border'}`}
                      >
                        <Text className={`text-xs font-bold text-center ${selectedChoice === key ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
              <TextInput
                className="min-h-[80px] border border-neutral-border rounded-xl p-3 text-base text-text-primary bg-white mb-3"
                placeholder="Type your answer..."
                multiline
                value={myAnswer}
                onChangeText={setMyAnswer}
              />
              <Button title={mySaved ? 'Update answer' : 'Submit answer'} onPress={submitAnswer} loading={submitGameAnswer.isPending} />

              <View className="mt-5 pt-4 border-t border-slate-100">
                <Text className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Both answers</Text>
                {[mySaved, partnerSaved].filter(Boolean).map((item) => (
                  <View key={item!.id} className="flex-row gap-3 mb-3">
                    <ProfileAvatar
                      uri={item!.user_id === user?.id ? profile?.avatar_url : partnerProfile?.avatar_url}
                      name={item!.profiles?.display_name}
                      size={36}
                    />
                    <View className="flex-1 bg-slate-50 rounded-xl p-3">
                      <Text className="text-xs font-bold text-text-primary capitalize">
                        {item!.profiles?.display_name || (item!.user_id === user?.id ? 'You' : 'Partner')}
                      </Text>
                      <Text className="text-sm text-text-secondary mt-1">{item!.answer_text}</Text>
                    </View>
                  </View>
                ))}
                {!mySaved && !partnerSaved ? (
                  <Text className="text-xs text-text-secondary">No answers yet — be the first.</Text>
                ) : null}
                {mySaved && !partnerSaved ? (
                  <Text className="text-xs text-amber-700 mt-2">Waiting for your partner&apos;s answer.</Text>
                ) : null}
              </View>
            </Card>
          </>
        )}

        <Button title="Randomize Prompt" onPress={nextPrompt} className="mt-5" disabled={!cards.length || cardsLoading} />
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
