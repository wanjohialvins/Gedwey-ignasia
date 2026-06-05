import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDiscoverySessionByToken, useSubmitGuestAnswer } from '../../lib/queries/discovery';
import { useAuthStore } from '../../lib/store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { ScreenShell } from '../../components/ScreenShell';
import { useTheme } from '../../lib/hooks/useTheme';

export default function GuestRevealScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  const { data: session, isLoading, error } = useDiscoverySessionByToken(token || '');
  const submitAnswer = useSubmitGuestAnswer();

  const [guestName, setGuestName] = useState('');
  const [guestAnswer, setGuestAnswer] = useState('');

  const handleSubmit = async () => {
    if (!guestName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!guestAnswer.trim()) {
      Alert.alert('Answer Required', 'Please enter your answer.');
      return;
    }
    if (!token) return;

    try {
      await submitAnswer.mutateAsync({
        token,
        guestName: guestName.trim(),
        guestAnswer: guestAnswer.trim(),
      });
      Alert.alert('Submitted!', 'Answers have been revealed.');
    } catch (err: any) {
      Alert.alert('Failed to Submit', err.message || 'Could not submit your answer.');
    }
  };

  const handleActionClick = () => {
    if (user) {
      router.replace('/discovery');
    } else {
      router.replace('/(auth)/sign-up');
    }
  };

  if (isLoading) {
    return (
      <ScreenShell className="flex-1">
        <View className="flex-1 bg-transparent px-4 pt-16 pb-6">
          {/* Header Skeleton */}
          <View className="items-center mb-6">
            <Skeleton width={120} height={32} className="mb-2" />
            <Skeleton width={80} height={16} className="mb-2" />
            <Skeleton width={200} height={14} />
          </View>

          {/* Question card Skeleton */}
          <Card className="p-6 mb-6 items-center">
            <Skeleton width="90%" height={24} className="mb-2" />
            <Skeleton width="60%" height={24} />
          </Card>

          {/* Form Skeleton */}
          <Card className="p-5">
            <Skeleton width={120} height={20} className="mb-4 self-center" />
            
            <Skeleton width={80} height={14} className="mb-2" />
            <Skeleton width="100%" height={44} className="mb-4 rounded-xl" />

            <Skeleton width={80} height={14} className="mb-2" />
            <Skeleton width="100%" height={100} className="mb-5 rounded-xl" />

            <Skeleton width="100%" height={48} className="rounded-xl" />
          </Card>
        </View>
      </ScreenShell>
    );
  }

  if (error || !session) {
    return (
      <ScreenShell className="flex-1">
        <View className="flex-1 bg-transparent justify-center items-center px-6">
          <Text className="text-5xl mb-4">🧐</Text>
          <Text className="text-base text-text-secondary text-center leading-relaxed mb-6" style={{ color: theme.textSecondary }}>
            {error?.message || 'This shared moment link is invalid or has expired.'}
          </Text>
          <Button title="Go to Home" onPress={() => router.replace('/')} className="w-full" />
        </View>
      </ScreenShell>
    );
  }

  const isCompleted = !!session.completed_at;

  return (
    <ScreenShell className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold tracking-tight" style={{ color: theme.accent }}>Moments</Text>
            <Text className="text-base font-normal mt-0.5 text-text-secondary" style={{ color: theme.textSecondary }}>for Two</Text>
            <Text className="text-xs text-text-muted mt-3 text-center" style={{ color: theme.textTertiary }}>
              {isCompleted ? 'All answers revealed!' : 'Answer to reveal responses.'}
            </Text>
          </View>

          {/* Question card */}
          <Card className="p-6 mb-6 items-center relative">
            <Text className="text-7xl font-bold text-blue-50/70 absolute top-[-10px] left-4">“</Text>
            <Text className="text-base font-semibold text-center leading-relaxed mt-5" style={{ color: theme.textPrimary }}>
              {session.cards?.text || 'Loading prompt...'}
            </Text>
          </Card>

          {/* Reveal State */}
          {isCompleted ? (
            <View className="flex-1 gap-4">
              {/* Creator's Answer bubble */}
              <Card glass className="p-4 self-start max-w-[85%] border shadow-sm">
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-sm mr-1.5">👤</Text>
                  <Text className="text-xs font-bold text-text-secondary" style={{ color: theme.textSecondary }}>Partner</Text>
                </View>
                <Text className="text-sm text-text-primary leading-normal" style={{ color: theme.textPrimary }}>{session.creator_answer}</Text>
              </Card>

              {/* Guest's Answer bubble */}
              <Card 
                glass 
                className="p-4 self-end max-w-[85%] border shadow-sm"
                style={{
                  backgroundColor: isDark ? 'rgba(79, 70, 229, 0.12)' : 'rgba(79, 70, 229, 0.06)',
                  borderColor: isDark ? 'rgba(79, 70, 229, 0.25)' : 'rgba(79, 70, 229, 0.15)',
                }}
              >
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-sm mr-1.5">👋</Text>
                  <Text className="text-xs font-bold text-text-secondary" style={{ color: theme.textSecondary }}>{session.guest_name || 'Guest'}</Text>
                </View>
                <Text className="text-sm text-text-primary leading-normal" style={{ color: theme.textPrimary }}>{session.guest_answer}</Text>
              </Card>

              <Button
                title={user ? 'Create Your Own Card' : 'Sign Up to Start Sharing'}
                onPress={handleActionClick}
                className="w-full mt-4"
              />
            </View>
          ) : (
            /* Form Input State */
            <Card glass className="p-5 border shadow-md">
              <Text className="text-lg font-semibold text-text-primary text-center mb-4" style={{ color: theme.textPrimary }}>Your Response</Text>

              <Input
                label="Your Name"
                placeholder="Enter your name"
                value={guestName}
                onChangeText={setGuestName}
              />

              <Input
                label="Your Answer"
                placeholder="Your honest answer..."
                multiline
                numberOfLines={4}
                value={guestAnswer}
                onChangeText={setGuestAnswer}
                className="h-28 text-left py-3.5"
              />

              <Button
                title="Submit & Reveal Answers"
                onPress={handleSubmit}
                disabled={!guestName.trim() || !guestAnswer.trim() || submitAnswer.isPending}
                loading={submitAnswer.isPending}
                className="w-full mt-2"
              />
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
