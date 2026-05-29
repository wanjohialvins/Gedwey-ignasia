import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile, useCouple } from '../../lib/queries/profile';
import { useSessionHistory, useActiveSession } from '../../lib/queries/sessions';
import { useTimeCapsules } from '../../lib/queries/capsules';
import { sendPushNotification } from '../../lib/notifications';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import NudgeOverlay from '../../components/NudgeOverlay';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // 1. Core Profile & Partner Queries
  const { data: profile, isLoading: isProfileLoading } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile, isLoading: isPartnerLoading } = useUserProfile(
    profile?.partner_id ?? ''
  );
  const { data: coupleDetails, isLoading: isCoupleLoading } = useCouple(
    profile?.couple_id ?? ''
  );

  // 2. Session History & Active Session Queries
  const { data: sessionHistory, isLoading: isHistoryLoading } = useSessionHistory(
    profile?.couple_id ?? ''
  );
  const { data: activeSession, isLoading: isActiveSessionLoading } = useActiveSession(
    profile?.couple_id ?? ''
  );
  
  // 3. Time Capsules Query
  const { data: capsules, isLoading: isCapsulesLoading } = useTimeCapsules(
    profile?.couple_id ?? ''
  );

  const completedSessionsCount = sessionHistory?.length ?? 0;
  const isJournalUnlocked = completedSessionsCount >= 5;
  const isPaired = !!profile?.couple_id;
  const capsulesCount = capsules?.length ?? 0;

  // 4. Sidebar Drawer State & Reanimated Animation Values
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  
  const drawerTranslateX = useSharedValue(-280);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isDrawerOpen) {
      setDrawerMounted(true);
      drawerTranslateX.value = withSpring(0, { damping: 18, stiffness: 95 });
      backdropOpacity.value = withTiming(0.4, { duration: 250 });
    } else {
      drawerTranslateX.value = withSpring(-280, { damping: 18, stiffness: 95 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
      const timer = setTimeout(() => {
        setDrawerMounted(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // 5. Helpers & Calculations
  const getAnniversaryText = (createdAtString?: string) => {
    if (!createdAtString) return '—';
    const createdDate = new Date(createdAtString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Connected today! 🌟';
    if (diffDays < 7) return `${diffDays} days connected 💛`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} connected 💛`;
  };

  const getMilestoneProgress = () => {
    const max = 10;
    const current = Math.min(completedSessionsCount, max);
    const percentage = (current / max) * 100;
    return { current, max, percentage };
  };

  const getPartnerMoodText = () => {
    if (!activeSession) return null;
    const isUser1 = activeSession.user1_id === user?.id;
    const mood = isUser1 ? activeSession.user2_mood : activeSession.user1_mood;
    if (!mood) return null;
    
    const moodEmojis: Record<string, string> = {
      happy: '😊 Happy',
      excited: '🤩 Excited',
      calm: '😌 Calm',
      tired: '😴 Tired',
      stressed: '😰 Stressed',
      sad: '😢 Sad',
    };
    return moodEmojis[mood.toLowerCase()] || mood;
  };

  // Nudge broadcasting helper
  const handleSendNudge = async () => {
    if (!isPaired || !profile) return;
    
    try {
      const channelId = `nudges:${profile.couple_id}`;
      const channel = supabase.channel(channelId);
      
      // Subscribe and broadcast Nudge event immediately
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'nudge',
            payload: {
              sender: profile.display_name || 'Your Partner',
              senderId: user?.id,
            },
          });
          console.log('[Dashboard] Nudge broadcast successful');
        }
      });

      // Dispatch push notification to partner
      if (partnerProfile?.expo_push_token) {
        sendPushNotification(
          partnerProfile.expo_push_token,
          'Thinking of You 💓',
          `${profile.display_name || 'Your partner'} sent you a gentle nudge!`
        );
      }
      
      Alert.alert('Nudge Sent! 💌', 'You sent a loving nudge to your partner.');
    } catch (err) {
      console.error('Failed to send nudge:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsDrawerOpen(false);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const navigateFromDrawer = (route: string) => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const isLoading =
    isProfileLoading ||
    (isPaired && (isPartnerLoading || isCoupleLoading || isHistoryLoading || isCapsulesLoading || isActiveSessionLoading));

  if (isLoading || !profile) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }}>
        {/* Header Skeleton */}
        <View className="mb-6 flex-row items-center gap-3">
          <Skeleton width={44} height={44} variant="circle" />
          <View>
            <Skeleton width={120} height={20} className="mb-2" />
            <Skeleton width={80} height={14} />
          </View>
        </View>

        {/* Home Widget Skeleton */}
        <View className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm mb-5">
          <Skeleton width={140} height={20} className="mb-3" />
          <Skeleton width="100%" height={50} className="rounded-xl" />
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
        {[1, 2].map((i) => (
          <View key={i} className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Skeleton width={40} height={40} variant="circle" />
              <Skeleton width={70} height={20} className="rounded-lg" />
            </View>
            <Skeleton width={140} height={20} className="mb-2" />
            <Skeleton width="90%" height={16} />
          </View>
        ))}
      </ScrollView>
    );
  }

  const { percentage, current: currentMilestones } = getMilestoneProgress();
  const partnerMoodText = getPartnerMoodText();

  return (
    <View className="flex-1 bg-background">
      {/* Real-time Fading Nudge Animated Heart Overlay */}
      <NudgeOverlay />

      <ScrollView className="flex-1 px-4 pt-14 pb-8" showsVerticalScrollIndicator={false}>
        {/* Customized Premium Header with Menu Trigger */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            className="w-11 h-11 bg-primary-100 items-center justify-center rounded-full active:opacity-75"
            onPress={() => setIsDrawerOpen(true)}
          >
            <Text className="text-xl text-primary-600 font-bold">☰</Text>
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-sm font-semibold text-text-secondary">Welcome 👋</Text>
            <Text className="text-base font-bold text-text-primary capitalize">
              {profile.display_name || user?.email?.split('@')[0]}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-slate-100 items-center justify-center rounded-full active:opacity-75"
            onPress={() => router.push('/settings')}
          >
            <Text className="text-base">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Intimate Streak & Relationship Stats Widget */}
        <Card className="p-5 mb-5 border border-primary-100 bg-blue-50/15">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-bold text-text-primary">Relationship Streak</Text>
            <Text className="text-lg font-bold text-primary-600">🔥 {coupleDetails?.streak || 0} Days</Text>
          </View>
          <Text className="text-xs text-text-secondary leading-normal">
            {isPaired
              ? `Keep linking and sharing answers together! ${getAnniversaryText(coupleDetails?.created_at)}`
              : 'Pair with your partner to start your daily login and active relationship streak.'}
          </Text>
        </Card>

        {/* Partner status / mood widget */}
        <Card className="p-5 mb-5">
          <Text className="text-sm font-bold text-text-primary mb-3">Partner's Daily Status</Text>
          {isPaired ? (
            <View className="flex-row items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">👤</Text>
                <View>
                  <Text className="text-xs font-semibold text-text-primary capitalize">{partnerProfile?.display_name || 'Partner'}</Text>
                  <Text className="text-2xs text-text-muted mt-0.5">Online Status: Active</Text>
                </View>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-lg">
                <Text className="text-xs font-semibold text-primary-600">
                  {partnerMoodText ? `Feeling: ${partnerMoodText}` : 'No Daily Mood Set'}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-slate-50 border border-slate-100 rounded-xl p-4 items-center">
              <Text className="text-xs text-text-secondary mb-3 text-center leading-normal">
                Linking with your partner unlocks daily real-time status and emotional mood indicators on your dashboard.
              </Text>
              <Button
                title="Pair with Partner"
                variant="secondary"
                onPress={() => router.push('/settings')}
                className="w-full"
              />
            </View>
          )}
        </Card>

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
            <Text className="text-2xs text-text-muted text-center leading-normal">
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
            <Text className="text-2xs text-text-muted text-center leading-normal">
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
              ? 'Lock memories & photos to open together in the future'
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

        {/* Recent Shared Moments Feed Carousel */}
        {isPaired && sessionHistory && sessionHistory.length > 0 && (
          <View className="mb-8">
            <Text className="text-base font-bold text-text-primary mb-3">Recent Moments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
              {sessionHistory.slice(0, 5).map((session) => (
                <Card key={session.id} className="p-4 w-[240px] mr-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-semibold text-primary-600">Revealed</Text>
                    <Text className="text-3xs text-text-muted">
                      {session.completed_at ? new Date(session.completed_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <Text className="text-xs font-medium text-text-primary mb-1.5" numberOfLines={2}>
                    "{session.cards?.text || 'Relationship Question'}"
                  </Text>
                  <View className="bg-slate-50 p-2 rounded-lg">
                    <Text className="text-3xs text-text-secondary italic" numberOfLines={2}>
                      You: "{session.user1_id === user?.id ? session.user1_answer : session.user2_answer}"
                    </Text>
                  </View>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Intimate Heart Nudge Trigger Button */}
      {isPaired && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-pink-500 w-14 h-14 rounded-full justify-center items-center shadow-lg active:bg-pink-400 z-40"
          onPress={handleSendNudge}
          activeOpacity={0.8}
        >
          <Text className="text-white text-2xl">💓</Text>
        </TouchableOpacity>
      )}

      {/* Premium Sliding Reanimated Sidebar Drawer */}
      {drawerMounted && (
        <View className="absolute inset-0 z-50 flex-row">
          {/* Backdrop Layer */}
          <Animated.View
            onTouchStart={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950"
            style={backdropAnimatedStyle}
          />
          {/* Drawer Sidebar Menu Panel */}
          <Animated.View
            className="w-[280px] h-full bg-white px-5 pt-16 pb-8 shadow-2xl flex-col"
            style={drawerAnimatedStyle}
          >
            {/* Relationship Status Header */}
            <View className="mb-6 pb-5 border-b border-slate-100">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xl font-bold text-text-primary">Moments</Text>
                <TouchableOpacity
                  onPress={() => setIsDrawerOpen(false)}
                  className="bg-slate-100 w-8 h-8 rounded-full items-center justify-center active:bg-slate-200"
                >
                  <Text className="text-sm font-bold text-text-secondary">×</Text>
                </TouchableOpacity>
              </View>
              <View className="mt-1 flex-col gap-0.5">
                <Text className="text-xs text-primary-600 font-semibold">
                  {isPaired ? `🔥 ${coupleDetails?.streak || 0} Day Streak` : 'Unpaired'}
                </Text>
                {isPaired && (
                  <Text className="text-3xs text-text-secondary">
                    {getAnniversaryText(coupleDetails?.created_at)}
                  </Text>
                )}
              </View>
            </View>

            {/* Profile split quick-view */}
            <View className="mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row items-center justify-around">
              <View className="items-center">
                <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mb-1">
                  <Text className="text-xs font-semibold text-primary-600">You</Text>
                </View>
                <Text className="text-2xs font-semibold text-text-primary capitalize w-[70px] text-center" numberOfLines={1}>
                  {profile.display_name || 'Me'}
                </Text>
              </View>
              <Text className="text-lg">❤️</Text>
              <View className="items-center">
                <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mb-1">
                  <Text className="text-xs font-semibold text-pink-600">P</Text>
                </View>
                {isPaired ? (
                  <Text className="text-2xs font-semibold text-text-primary capitalize w-[70px] text-center" numberOfLines={1}>
                    {partnerProfile?.display_name || 'Partner'}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={() => navigateFromDrawer('/settings')}>
                    <Text className="text-[10px] font-semibold text-primary-600 underline text-center w-[70px]">Link</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Mode Indicator */}
            <View className="mb-6">
              <Text className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-2">Relationship Mode</Text>
              <View className="bg-primary-100 border border-primary-200 p-2.5 rounded-xl flex-row items-center gap-2">
                <Text className="text-sm">✨</Text>
                <Text className="text-xs font-semibold text-primary-600 capitalize">
                  {profile.app_mode.replace('_', ' ')} Mode
                </Text>
              </View>
            </View>

            {/* Milestones Progression */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-3xs font-bold text-text-muted uppercase tracking-wider">Milestones Progress</Text>
                <Text className="text-3xs font-semibold text-primary-600">{currentMilestones}/10 Unlocks</Text>
              </View>
              <View className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <View className="bg-primary-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
              </View>
              <Text className="text-3xs text-text-secondary mt-1.5">
                {completedSessionsCount < 5 
                  ? `${5 - completedSessionsCount} sessions to unlock Shared Journal`
                  : completedSessionsCount < 10 
                  ? `${10 - completedSessionsCount} sessions to unlock Health Check` 
                  : 'All primary milestones unlocked! 🎉'}
              </Text>
            </View>

            {/* Menu Items Link */}
            <ScrollView className="mt-2 flex-1" showsVerticalScrollIndicator={false}>
              <View className="gap-1 pb-4">
                <TouchableOpacity
                  onPress={() => navigateFromDrawer('/')}
                  className="py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">🏠</Text>
                    <Text className="text-sm font-semibold text-text-primary">Dashboard</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigateFromDrawer('/settings')}
                  className="py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">⚙️</Text>
                    <Text className="text-sm font-semibold text-text-primary">App Settings</Text>
                  </View>
                </TouchableOpacity>

                {/* Discovery Mode */}
                <TouchableOpacity
                  onPress={() => navigateFromDrawer('/discovery')}
                  className="py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">✨</Text>
                    <Text className="text-sm font-semibold text-text-primary">Discovery Mode</Text>
                  </View>
                </TouchableOpacity>

                {/* Couple Sessions */}
                <TouchableOpacity
                  onPress={() => {
                    if (isPaired) {
                      navigateFromDrawer('/session/start');
                    } else {
                      Alert.alert(
                        'Pairing Required 🔒',
                        'You need to pair with a partner to start shared couple sessions. Go to App Settings to share your invite code.'
                      );
                    }
                  }}
                  className={`py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100 ${
                    !isPaired ? 'opacity-60' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">🎴</Text>
                    <Text className="text-sm font-semibold text-text-primary">Couple Sessions</Text>
                  </View>
                  {!isPaired && <Text className="text-[10px] text-text-muted">🔒</Text>}
                </TouchableOpacity>

                {/* Shared Journal */}
                <TouchableOpacity
                  onPress={() => {
                    if (!isPaired) {
                      Alert.alert('Pairing Required 🔒', 'You need to be paired with a partner to access the Shared Journal.');
                    } else if (!isJournalUnlocked) {
                      Alert.alert(
                        'Journal Locked 🔒',
                        `Complete 5 sessions to unlock your shared space. Currently completed: ${completedSessionsCount}/5 sessions.`
                      );
                    } else {
                      navigateFromDrawer('/journal');
                    }
                  }}
                  className={`py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100 ${
                    (!isPaired || !isJournalUnlocked) ? 'opacity-60' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">📓</Text>
                    <Text className="text-sm font-semibold text-text-primary">Shared Journal</Text>
                  </View>
                  {(!isPaired || !isJournalUnlocked) && <Text className="text-[10px] text-text-muted">🔒</Text>}
                </TouchableOpacity>

                {/* Time Capsules */}
                <TouchableOpacity
                  onPress={() => {
                    if (isPaired) {
                      navigateFromDrawer('/capsule');
                    } else {
                      Alert.alert('Pairing Required 🔒', 'You need to pair with a partner to access Time Capsules.');
                    }
                  }}
                  className={`py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100 ${
                    !isPaired ? 'opacity-60' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">⏳</Text>
                    <Text className="text-sm font-semibold text-text-primary">Time Capsules</Text>
                  </View>
                  {!isPaired && <Text className="text-[10px] text-text-muted">🔒</Text>}
                </TouchableOpacity>

                {/* Relationship Health */}
                <TouchableOpacity
                  onPress={() => {
                    const isHealthUnlocked = completedSessionsCount >= 10;
                    if (!isPaired) {
                      Alert.alert('Pairing Required 🔒', 'You need to be paired with a partner to access Relationship Health.');
                    } else if (!isHealthUnlocked) {
                      Alert.alert(
                        'Milestone Locked 🔒',
                        `Complete 10 shared sessions to unlock Relationship Health Check-ins. Progress: ${completedSessionsCount}/10 sessions.`
                      );
                    } else {
                      navigateFromDrawer('/health');
                    }
                  }}
                  className={`py-2.5 px-3.5 rounded-xl flex-row items-center justify-between active:bg-slate-100 ${
                    (!isPaired || completedSessionsCount < 10) ? 'opacity-60' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base">❤️</Text>
                    <Text className="text-sm font-semibold text-text-primary">Relationship Health</Text>
                  </View>
                  {(!isPaired || completedSessionsCount < 10) && <Text className="text-[10px] text-text-muted">🔒</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bottom Footer Actions */}
            <View className="border-t border-slate-100 pt-4 mt-auto">
              <Button
                title="Sign Out"
                onPress={handleSignOut}
                variant="secondary"
                className="w-full"
              />
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
