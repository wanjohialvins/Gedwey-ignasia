import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCreateHealthCheckin } from '../../../lib/queries/health';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ScreenShell } from '../../../components/ScreenShell';

interface DimensionSpec {
  key: 'communication' | 'intimacy' | 'trust' | 'connection' | 'conflict';
  title: string;
  desc: string;
  labels: Record<number, string>;
}

const DIMENSIONS: DimensionSpec[] = [
  {
    key: 'communication',
    title: 'Communication',
    desc: 'How well do we listen, share feelings, and understand each other?',
    labels: {
      1: 'Drifting apart',
      2: 'Frequent silence',
      3: 'Misunderstood',
      4: 'Surface level',
      5: 'Average talk',
      6: 'Constructive conversations',
      7: 'Open & honest dialogue',
      8: 'Deeply understood',
      9: 'Highly fluent',
      10: 'Flawless synergy & trust',
    },
  },
  {
    key: 'intimacy',
    title: 'Intimacy',
    desc: 'How close do we feel physically, emotionally, and affectionately?',
    labels: {
      1: 'Completely cold',
      2: 'Distant bounds',
      3: 'Lacking affection',
      4: 'Low warmth',
      5: 'Neutral intimacy',
      6: 'Comfortable closeness',
      7: 'Very affectionate',
      8: 'Highly intimate & warm',
      9: 'Deep emotional fire',
      10: 'Perfect intimacy & spark',
    },
  },
  {
    key: 'trust',
    title: 'Trust & Safety',
    desc: 'How secure, reliable, and emotionally safe do we feel with each other?',
    labels: {
      1: 'Broken trust',
      2: 'Constant suspicion',
      3: 'Insecure feeling',
      4: 'Slight hesitation',
      5: 'Neutral reliability',
      6: 'Comfortable safety',
      7: 'Highly secure',
      8: 'Total emotional safety',
      9: 'Absolute loyalty',
      10: 'Unshakable mutual trust',
    },
  },
  {
    key: 'connection',
    title: 'Connection',
    desc: 'How aligned are our schedules, values, and quality time spent together?',
    labels: {
      1: 'Parallel lives',
      2: 'Zero quality time',
      3: 'Out of sync',
      4: 'Low alignments',
      5: 'Sufficient sync',
      6: 'Great weekly times',
      7: 'Deeply aligned values',
      8: 'Incredibly in-sync',
      9: 'Unified synergy',
      10: 'Perfect soul alignment',
    },
  },
  {
    key: 'conflict',
    title: 'Conflict Resolution',
    desc: 'How constructively do we handle disagreements and reach reconciliation?',
    labels: {
      1: 'Explosive fights',
      2: 'Constant gridlock',
      3: 'Lingering tension',
      4: 'Difficult compromise',
      5: 'Average reconciliation',
      6: 'Constructive talks',
      7: 'Calm compromises',
      8: 'Incredible understanding',
      9: 'Rapid peaceful fixes',
      10: 'Harmonious understanding',
    },
  },
];

export default function HealthCheckinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile } = useUserProfile(user?.id ?? '');
  const createCheckin = useCreateHealthCheckin();

  // State to hold ratings for all 5 dimensions
  const [ratings, setRatings] = useState<Record<string, number>>({
    communication: 0,
    intimacy: 0,
    trust: 0,
    connection: 0,
    conflict: 0,
  });

  const handleSelectScore = (dimensionKey: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [dimensionKey]: score,
    }));
  };

  const handleSubmit = async () => {
    // Validate that all dimensions have been rated
    const unrated = DIMENSIONS.filter((d) => ratings[d.key] === 0);
    if (unrated.length > 0) {
      Alert.alert(
        'Ratings Required',
        `Please complete all ratings. Remaining: ${unrated.map((u) => u.title).join(', ')}.`
      );
      return;
    }

    const coupleId = profile?.couple_id;
    const userId = user?.id;

    if (!coupleId || !userId) {
      Alert.alert('Error', 'Unable to resolve couple identity. Ensure you are paired.');
      return;
    }

    try {
      await createCheckin.mutateAsync({
        coupleId,
        userId,
        communication: ratings.communication,
        intimacy: ratings.intimacy,
        trust: ratings.trust,
        connection: ratings.connection,
        conflict: ratings.conflict,
      });
      router.replace('/health');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save check-in.');
    }
  };

  const isPending = createCheckin.isPending;

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
            <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-text-primary">Weekly Health Check-in</Text>
            <Text className="text-sm text-text-secondary mt-1 mb-6 leading-relaxed">
              Reflect on your connection this week. Rate each dimension honestly from 1 to 10.
            </Text>

            <View className="gap-5">
              {DIMENSIONS.map((dim) => {
                const currentScore = ratings[dim.key];
                const scoreLabel = dim.labels[currentScore] || 'Tap a number to rate';

                return (
                  <Card key={dim.key} className="p-4">
                    <Text className="text-base font-bold text-text-primary mb-1">{dim.title}</Text>
                    <Text className="text-xs text-text-secondary leading-relaxed mb-4">{dim.desc}</Text>

                    {/* Rating Selector circle grids */}
                    <View className="flex-row justify-between flex-wrap gap-2.5 mb-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                        const isSelected = currentScore === score;
                        return (
                          <TouchableOpacity
                            key={score}
                            className={`w-8 h-8 rounded-full justify-center items-center border active:bg-slate-200/50 ${
                              isSelected 
                                ? 'bg-primary-600 border-primary-600' 
                                : 'bg-white/60 border-neutral-border/10'
                            }`}
                            onPress={() => handleSelectScore(dim.key, score)}
                            activeOpacity={0.7}
                          >
                            <Text 
                              className={`text-xs font-semibold ${
                                isSelected ? 'text-white' : 'text-slate-600'
                              }`}
                            >
                              {score}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Description label for current selection */}
                    <View className="bg-white/40 border border-white/5 rounded-lg py-2.5 px-3 items-center">
                      <Text className="text-[11px] text-text-secondary font-medium text-center">
                        {currentScore > 0 ? `Rating: ${currentScore}/10 — ` : ''}
                        <Text className="font-bold text-primary-600">{scoreLabel}</Text>
                      </Text>
                    </View>
                  </Card>
                );
              })}

              <Button
                title="Submit Weekly Check-in"
                onPress={handleSubmit}
                disabled={Object.values(ratings).includes(0) || isPending}
                loading={isPending}
                className="w-full mt-2"
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}
