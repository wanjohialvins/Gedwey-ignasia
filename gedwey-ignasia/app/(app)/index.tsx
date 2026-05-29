import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import { useSessionHistory } from '../../lib/queries/sessions';
import { useTimeCapsules } from '../../lib/queries/capsules';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile(user?.id ?? '');
  const router = useRouter();
  
  const { data: sessionHistory, isLoading: isHistoryLoading } = useSessionHistory(profile?.couple_id ?? '');
  const completedSessionsCount = sessionHistory?.length ?? 0;
  const isJournalUnlocked = completedSessionsCount >= 5;

  const { data: capsules, isLoading: isCapsulesLoading } = useTimeCapsules(profile?.couple_id ?? '');
  const capsulesCount = capsules?.length ?? 0;

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const isPaired = !!profile?.couple_id;
  const isLoading = isProfileLoading || (isPaired && (isHistoryLoading || isCapsulesLoading));

  if (isLoading || !profile) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }}>
        {/* Header Skeleton */}
        <View className="mb-6">
          <Skeleton width={120} height={28} className="mb-2" />
          <Skeleton width={180} height={16} />
        </View>

        {/* Feature Cards Grid Skeleton */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white p-5 rounded-2xl border border-neutral-border shadow-sm items-center">
            <Skeleton width={40} height={40} variant="circle" className="mb-3" />
            <Skeleton width={80} height={16} className="mb-2" />
            <Skeleton width="100%" height={24} />
          </View>
          <View className="flex-1 bg-white p-5 rounded-2xl border border-neutral-border shadow-sm items-center">
            <Skeleton width={40} height={40} variant="circle" className="mb-3" />
            <Skeleton width={80} height={16} className="mb-2" />
            <Skeleton width="100%" height={24} />
          </View>
        </View>

        {/* Journal, Capsule, Health Skeletons */}
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Skeleton width={40} height={40} variant="circle" />
              <Skeleton width={70} height={20} className="rounded-lg" />
            </View>
            <Skeleton width={140} height={20} className="mb-2" />
            <Skeleton width="90%" height={16} />
          </View>
        ))}

        {/* Status Card Skeleton */}
        <View className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm mb-5">
          <Skeleton width={150} height={20} className="mb-4" />
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-slate-100">
              <Skeleton width={60} height={16} />
              <Skeleton width={80} height={16} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }}>
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary">Welcome 👋</Text>
        <Text className="text-sm text-text-secondary mt-1 capitalize">
          {profile?.display_name || user?.email}
        </Text>
      </View>

      {/* Feature Cards Grid */}
      <View className="flex-row gap-3 mb-5">
        {/* Discovery Mode */}
        <TouchableOpacity
          className="flex-1 bg-white rounded-2xl p-5 border border-neutral-border shadow-sm items-center active:bg-slate-50"
          onPress={() => router.push('/discovery')}
          activeOpacity={0.85}
        >
          <Text className="text-3xl mb-2">✨</Text>
          <Text className="text-base font-semibold text-text-primary mb-1">Discovery</Text>
          <Text className="text-xs text-text-muted text-center leading-normal">
            Share & compare answers with anyone
          </Text>
        </TouchableOpacity>

        {/* Sessions */}
        <TouchableOpacity
          className={`flex-1 bg-white rounded-2xl p-5 border border-neutral-border shadow-sm items-center active:bg-slate-50 ${
            !isPaired ? 'opacity-60' : ''
          }`}
          onPress={() => {
            if (isPaired) {
              router.push('/session/start');
            } else {
              Alert.alert('Pairing Required', 'You need to pair with a partner to start sessions. Go to settings to share your invite code.');
            }
          }}
          activeOpacity={0.85}
        >
          <Text className="text-3xl mb-2">🎴</Text>
          <Text className="text-base font-semibold text-text-primary mb-1">Sessions</Text>
          <Text className="text-xs text-text-muted text-center leading-normal">
            {isPaired ? 'Shared couple sessions' : 'Pair with partner first'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shared Journal Card */}
      <TouchableOpacity
        className={`bg-white rounded-2xl p-5 border border-neutral-border shadow-sm mb-5 active:bg-slate-50 ${
          (!isPaired || !isJournalUnlocked) ? 'border-slate-200 bg-slate-50/50 opacity-90' : ''
        }`}
        onPress={() => {
          if (!isPaired) {
            Alert.alert('Pairing Required', 'You need to be paired with a partner to access the Shared Journal.');
          } else if (!isJournalUnlocked) {
            Alert.alert(
              'Journal Locked 🔒',
              `Complete 5 sessions to unlock your shared space. Currently completed: ${completedSessionsCount}/5 sessions.`
            );
          } else {
            router.push('/journal');
          }
        }}
        activeOpacity={0.85}
      >
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-3xl">📓</Text>
          {!isJournalUnlocked && (
            <View className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
              <Text className="text-2xs font-bold text-primary-600">🔒 Locked</Text>
            </View>
          )}
        </View>
        <Text className="text-lg font-bold text-text-primary mb-1">Shared Journal</Text>
        <Text className="text-xs text-text-secondary leading-normal">
          {isJournalUnlocked
            ? 'Write and explore shared private memories'
            : `Unlock after 5 sessions • Progress: ${completedSessionsCount}/5`}
        </Text>
      </TouchableOpacity>

      {/* Time Capsule Card */}
      <TouchableOpacity
        className={`bg-white rounded-2xl p-5 border border-neutral-border shadow-sm mb-5 active:bg-slate-50 ${
          !isPaired ? 'opacity-60' : ''
        }`}
        onPress={() => {
          if (isPaired) {
            router.push('/capsule');
          } else {
            Alert.alert('Pairing Required', 'You need to pair with a partner to access Time Capsules.');
          }
        }}
        activeOpacity={0.85}
      >
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-3xl">⏳</Text>
          {isPaired && capsulesCount > 0 && (
            <View className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
              <Text className="text-2xs font-bold text-primary-600">{capsulesCount} Capsules</Text>
            </View>
          )}
        </View>
        <Text className="text-lg font-bold text-text-primary mb-1">Time Capsules</Text>
        <Text className="text-xs text-text-secondary leading-normal">
          {isPaired
            ? 'Lock messages & photos to open together in the future'
            : 'Pair with your partner to lock memories'}
        </Text>
      </TouchableOpacity>

      {/* Relationship Health Card */}
      <TouchableOpacity
        className={`bg-white rounded-2xl p-5 border border-neutral-border shadow-sm mb-5 active:bg-slate-50 ${
          (!isPaired || completedSessionsCount < 10) ? 'border-slate-200 bg-slate-50/50 opacity-90' : ''
        }`}
        onPress={() => {
          if (!isPaired) {
            Alert.alert('Pairing Required', 'You need to be paired with a partner to access Relationship Health.');
          } else if (completedSessionsCount < 10) {
            Alert.alert(
              'Milestone Locked 🔒',
              `Complete 10 shared sessions to unlock Relationship Health Check-ins. Progress: ${completedSessionsCount}/10 sessions.`
            );
          } else {
            router.push('/health');
          }
        }}
        activeOpacity={0.85}
      >
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-3xl">❤️</Text>
          {completedSessionsCount < 10 ? (
            <View className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
              <Text className="text-2xs font-bold text-primary-600">🔒 Locked</Text>
            </View>
          ) : (
            <View className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
              <Text className="text-2xs font-bold text-primary-600">✨ Unlocked</Text>
            </View>
          )}
        </View>
        <Text className="text-lg font-bold text-text-primary mb-1">Relationship Health</Text>
        <Text className="text-xs text-text-secondary leading-normal">
          {completedSessionsCount >= 10
            ? 'Track and visualize your weekly couple alignment radar'
            : `Unlock after 10 sessions • Progress: ${completedSessionsCount}/10`}
        </Text>
      </TouchableOpacity>

      {/* Status Card */}
      <Card className="p-5 mb-6">
        <Text className="text-base font-semibold text-text-primary mb-4">Relationship Status</Text>
        <View className="flex-row justify-between py-3 border-b border-slate-100">
          <Text className="text-sm text-text-secondary">Mode</Text>
          <Text className="text-sm font-semibold text-text-primary capitalize">
            {profile?.app_mode?.replace('_', ' ') || '—'}
          </Text>
        </View>
        <View className="flex-row justify-between py-3 border-b border-slate-100">
          <Text className="text-sm text-text-secondary">Stage</Text>
          <Text className="text-sm font-semibold text-text-primary capitalize">
            {profile?.relationship_stage?.replace('_', ' ') || '—'}
          </Text>
        </View>
        <View className="flex-row justify-between py-3">
          <Text className="text-sm text-text-secondary">Partner</Text>
          <Text className="text-sm font-semibold text-text-primary capitalize">
            {isPaired ? 'Paired ❤️' : 'Not paired'}
          </Text>
        </View>
        {!isPaired && profile?.invite_code && (
          <View className="flex-row justify-between py-3 border-t border-slate-100 mt-1">
            <Text className="text-sm text-text-secondary">Your Code</Text>
            <Text className="text-sm font-bold text-primary-600 tracking-wider">
              {profile.invite_code}
            </Text>
          </View>
        )}
      </Card>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="secondary"
        className="w-full"
      />
    </ScrollView>
  );
}
