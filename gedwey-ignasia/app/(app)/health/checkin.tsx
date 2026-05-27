import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCreateHealthCheckin } from '../../../lib/queries/health';

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
    desc: 'How close do we feel physically, affectionately, and emotionally?',
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Weekly Health Check-in</Text>
          <Text style={styles.subtitle}>
            Reflect on your connection this week. Rate each dimension honestly from 1 to 10.
          </Text>

          <View style={styles.formContainer}>
            {DIMENSIONS.map((dim) => {
              const currentScore = ratings[dim.key];
              const scoreLabel = dim.labels[currentScore] || 'Tap a number to rate';

              return (
                <View key={dim.key} style={styles.dimensionSection}>
                  <Text style={styles.dimTitle}>{dim.title}</Text>
                  <Text style={styles.dimDesc}>{dim.desc}</Text>

                  {/* Rating Selector circle grids */}
                  <View style={styles.ratingGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isSelected = currentScore === score;
                      return (
                        <TouchableOpacity
                          key={score}
                          style={[styles.scoreCircle, isSelected && styles.scoreCircleSelected]}
                          onPress={() => handleSelectScore(dim.key, score)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.scoreText, isSelected && styles.scoreTextSelected]}>
                            {score}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Description label for current selection */}
                  <View style={styles.scoreLabelRow}>
                    <Text style={styles.scoreLabelText}>
                      {currentScore > 0 ? `Rating: ${currentScore}/10 — ` : ''}
                      <Text style={styles.scoreValueLabel}>{scoreLabel}</Text>
                    </Text>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (Object.values(ratings).includes(0) || isPending) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={Object.values(ratings).includes(0) || isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Submit Weekly Check-in</Text>
              )}
            </TouchableOpacity>
          </View>
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
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    gap: 20,
  },
  dimensionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  dimTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dimDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  ratingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreCircleSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  scoreTextSelected: {
    color: '#FFFFFF',
  },
  scoreLabelRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  scoreLabelText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  scoreValueLabel: {
    fontWeight: '700',
    color: '#2563EB',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
