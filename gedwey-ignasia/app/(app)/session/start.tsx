import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useActiveSession } from '../../../lib/queries/sessions';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';

export default function SessionStartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  const { data: activeSession, isLoading: sessionLoading } = useActiveSession(coupleId);

  const isLoading = profileLoading || sessionLoading;

  const handleNewSession = () => {
    if (!profile?.couple_id) {
      Alert.alert('Not Paired', 'You need to be paired with a partner to start a session.');
      return;
    }
    router.push('/session/deck');
  };

  const handleResumeSession = () => {
    if (!activeSession) return;

    const isUser1 = activeSession.user1_id === user?.id;
    const myAnswer = isUser1 ? activeSession.user1_answer : activeSession.user2_answer;

    if (myAnswer) {
      // Already answered, go to reveal/waiting
      router.push('/session/reveal');
    } else {
      // Need to answer
      router.push('/session/card');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16 pb-6">
        <Skeleton width={80} height={20} className="mb-8" />
        <View className="flex-1 justify-center items-center pb-16">
          <Skeleton width={70} height={70} variant="circle" className="mb-4" />
          <Skeleton width={180} height={28} className="mb-3" />
          <Skeleton width="100%" height={16} className="mb-2" />
          <Skeleton width="80%" height={16} className="mb-8" />

          <Card className="w-full p-5 mb-4 border border-blue-100">
            <Skeleton width={100} height={14} className="mb-2" />
            <Skeleton width="95%" height={18} className="mb-1" />
            <Skeleton width="70%" height={18} className="mb-4" />
            <Skeleton width="100%" height={48} className="rounded-xl" />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-16">
      <TouchableOpacity className="self-start py-1 mb-2" onPress={() => router.replace('/')}>
        <Text className="text-primary-600 text-sm font-semibold">← Home</Text>
      </TouchableOpacity>

      <View className="flex-1 justify-center items-center pb-16">
        <Text className="text-6xl mb-4">🎴</Text>
        <Text className="text-2xl font-bold text-text-primary mb-2 text-center">Couple Sessions</Text>
        <Text className="text-sm text-text-secondary text-center leading-relaxed mb-8 px-4">
          Answer shared prompts together. See how your partner responds — after you both answer.
        </Text>

        {activeSession ? (
          <Card className="w-full p-5 border border-primary-100 shadow-sm mb-4">
            <Text className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">
              Active Session
            </Text>
            <Text className="text-sm text-text-secondary leading-normal mb-4" numberOfLines={2}>
              {activeSession.cards?.text || 'Loading question...'}
            </Text>
            <Button
              title="Continue Session"
              onPress={handleResumeSession}
              className="w-full"
            />
          </Card>
        ) : (
          <Button
            title="Start New Session"
            onPress={handleNewSession}
            className="w-full"
          />
        )}
      </View>
    </View>
  );
}
