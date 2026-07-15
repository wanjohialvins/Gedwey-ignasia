import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';
import { useCouple, useUserProfile } from '../../lib/queries/profile';
import { useActiveSession, useSessionHistory } from '../../lib/queries/sessions';
import { useTimeCapsules } from '../../lib/queries/capsules';
import { sendPushNotification } from '../../lib/notifications';
import { partnerWantsNotifications } from '../../lib/notificationPrefs';
import { isFeatureUnlocked } from '../../lib/devMode';

import { BottomNav } from '../../components/BottomNav';
import { DevBadge } from '../../components/DevBadge';
import { AppIcon } from '../../components/AppIcon';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { LivePartnerWidget } from '../../components/LivePartnerWidget';
import { ScreenShell } from '../../components/ScreenShell';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import NudgeOverlay from '../../components/NudgeOverlay';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { preCacheTracks } from '../../lib/audioCache';
import { MOOD_TRACKS } from '../../lib/musicTracks';


export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: profile, isLoading: isProfileLoading } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile, isLoading: isPartnerLoading } = useUserProfile(profile?.partner_id ?? '');
  const { data: coupleDetails, isLoading: isCoupleLoading } = useCouple(profile?.couple_id ?? '');
  const { data: sessionHistory, isLoading: isHistoryLoading } = useSessionHistory(profile?.couple_id ?? '');
  const { data: activeSession, isLoading: isActiveSessionLoading } = useActiveSession(profile?.couple_id ?? '');
  const { data: capsules, isLoading: isCapsulesLoading } = useTimeCapsules(profile?.couple_id ?? '');

  // Pre-cache all nature soundscape loops on startup for smooth offline playback
  useEffect(() => {
    const urls = MOOD_TRACKS.map((t) => t.url);
    preCacheTracks(urls).catch((err) => console.log('[HomeScreen] Background pre-cache failed:', err));
  }, []);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const drawerTranslateX = useSharedValue(-300);
  const backdropOpacity = useSharedValue(0);

  const completedSessionsCount = sessionHistory?.length ?? 0;
  const isPaired = !!profile?.couple_id;
  const isJournalUnlocked = isFeatureUnlocked(completedSessionsCount >= 5);
  const isHealthUnlocked = isFeatureUnlocked(completedSessionsCount >= 10);
  const capsulesCount = capsules?.length ?? 0;

  useEffect(() => {
    if (isDrawerOpen) {
      setDrawerMounted(true);
      drawerTranslateX.value = withSpring(0, { damping: 18, stiffness: 95 });
      backdropOpacity.value = withTiming(0.4, { duration: 220 });
      return;
    }

    drawerTranslateX.value = withSpring(-300, { damping: 18, stiffness: 95 });
    backdropOpacity.value = withTiming(0, { duration: 180 });
    const timer = setTimeout(() => setDrawerMounted(false), 240);
    return () => clearTimeout(timer);
  }, [isDrawerOpen, drawerTranslateX, backdropOpacity]);

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const isLoading =
    isProfileLoading ||
    (isPaired && (isPartnerLoading || isCoupleLoading || isHistoryLoading || isCapsulesLoading || isActiveSessionLoading));

  const getAnniversaryText = (createdAtString?: string) => {
    if (!createdAtString) return 'Not paired yet';
    const diffDays = Math.max(1, Math.ceil(Math.abs(Date.now() - new Date(createdAtString).getTime()) / 86400000));
    if (diffDays === 1) return 'Connected today';
    if (diffDays < 7) return `${diffDays} days connected`;
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} connected`;
  };

  const getPartnerMoodText = () => {
    if (!activeSession) return null;
    const isUser1 = activeSession.user1_id === user?.id;
    const mood = isUser1 ? activeSession.user2_mood : activeSession.user1_mood;
    return mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : null;
  };

  const navigateFromDrawer = (route: string) => {
    setIsDrawerOpen(false);
    setTimeout(() => router.push(route as any), 200);
  };

  const handleLockedRoute = (route: string, unlocked: boolean, message: string) => {
    if (!isPaired) {
      Alert.alert('Pairing Required', 'Pair with your partner before opening this shared space.');
      return;
    }
    if (!unlocked) {
      Alert.alert('Milestone Locked', message);
      return;
    }
    navigateFromDrawer(route);
  };

  const handleSendNudge = async () => {
    if (!isPaired || !profile?.couple_id) return;

    try {
      const channel = supabase.channel(`nudges:${profile.couple_id}`);

      // If the channel is not yet subscribed, wait for subscription
      if (channel.state !== 'joined') {
        await new Promise<void>((resolve, reject) => {
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(`Realtime channel status: ${status}`));
            }
          });
        });
      }

      const sendResult = await channel.send({
        type: 'broadcast',
        event: 'nudge',
        payload: {
          sender: profile.display_name || 'Your Partner',
          senderId: user?.id,
        },
      });
      console.log('[handleSendNudge] Broadcast send result:', sendResult);

      if (partnerProfile?.expo_push_token && partnerWantsNotifications(partnerProfile)) {
        await sendPushNotification(
          partnerProfile.expo_push_token,
          'Thinking of You',
          `${profile.display_name || 'Your partner'} sent you a gentle nudge.`,
          { type: 'nudge' }
        );
      }

      Alert.alert('Nudge Sent', 'You sent a gentle nudge to your partner.');
    } catch {
      Alert.alert('Nudge Failed', 'Could not send that nudge right now.');
    }
  };

  const handleSignOut = async () => {
    setIsDrawerOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  };

  if (isLoading || !profile) {
    return (
      <ScreenShell className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row items-center gap-3">
            <Skeleton width={44} height={44} variant="circle" />
            <View>
              <Skeleton width={140} height={20} className="mb-2" />
              <Skeleton width={90} height={14} />
            </View>
          </View>
          {[1, 2, 3].map((item) => (
            <Card key={item} className="p-5 mb-5 border border-neutral-border shadow-sm">
              <Skeleton width={150} height={20} className="mb-3" />
              <Skeleton width="100%" height={48} className="rounded-xl" />
            </Card>
          ))}
        </ScrollView>
      </ScreenShell>
    );
  }

  const partnerMoodText = getPartnerMoodText();
  const progress = Math.min(completedSessionsCount, 10);

  const isDailyCompletedToday = sessionHistory?.some(session => {
    if (!session.completed_at) return false;
    const compDate = new Date(session.completed_at);
    const today = new Date();
    return (
      compDate.getUTCFullYear() === today.getUTCFullYear() &&
      compDate.getUTCMonth() === today.getUTCMonth() &&
      compDate.getUTCDate() === today.getUTCDate()
    );
  });

  const hasAnsweredActive = activeSession ? (
    (activeSession.user1_id === user?.id && activeSession.user1_answer) ||
    (activeSession.user2_id === user?.id && activeSession.user2_answer)
  ) : false;

  const isDailyPending = isPaired && !isDailyCompletedToday && !hasAnsweredActive;

  type SidebarRow = { label: string; detail: string; icon: typeof NAV_ICONS.dashboard; action: () => void };

  const sidebarSections: { title: string; items: SidebarRow[] }[] = [
    {
      title: 'Daily Companion',
      items: [
        { label: 'Cat Care', detail: 'Daily streak tasks', icon: NAV_ICONS.play, action: () => navigateFromDrawer('/cat-care') },
        { label: 'Music', detail: 'Our soundtrack', icon: NAV_ICONS.music, action: () => navigateFromDrawer('/music') },
        { label: 'Shared Lists', detail: 'To-dos and bucket goals', icon: NAV_ICONS.lists, action: () => navigateFromDrawer('/lists') },
        { label: 'Watchlist', detail: 'Shows & movie recs', icon: NAV_ICONS.watchlist, action: () => navigateFromDrawer('/watchlist') },
      ],
    },
    {
      title: 'Memories & Timeline',
      items: [
        { label: 'All Answers', detail: 'Shared game & session answers', icon: NAV_ICONS.session, action: () => navigateFromDrawer('/answers') },
        {
          label: 'Time Capsules',
          detail: capsulesCount ? `${capsulesCount} saved` : 'Future memories',
          icon: NAV_ICONS.capsule,
          action: () => {
            if (!isPaired) {
              Alert.alert('Pairing Required', 'Pair with your partner first.');
              return;
            }
            navigateFromDrawer('/capsule');
          },
        },
        { label: 'Important Dates', detail: 'Anniversaries & milestones', icon: NAV_ICONS.milestone, action: () => navigateFromDrawer('/dates') },
        { label: 'History Logs', detail: 'Activity timeline', icon: NAV_ICONS.history, action: () => navigateFromDrawer('/history') },
      ],
    },
    {
      title: 'Relationship Health',
      items: [
        {
          label: 'Relationship Health',
          detail: isHealthUnlocked ? 'Weekly alignment' : `Unlock ${completedSessionsCount}/10`,
          icon: NAV_ICONS.health,
          action: () =>
            handleLockedRoute(
              '/health',
              isHealthUnlocked,
              `Complete 10 Daily Questions to unlock relationship health. Progress: ${completedSessionsCount}/10.`
            ),
        },
        { label: 'Settings & Pairing', detail: 'Profile preferences', icon: NAV_ICONS.settings, action: () => navigateFromDrawer('/settings') },
      ],
    },
  ];

  // Quick-access tiles (slim strip — 4 tiles)
  const quickTiles = [
    { key: 'journal', label: 'Journal', icon: NAV_ICONS.journal, color: '#7F77DD', route: '/journal', locked: !isJournalUnlocked },
    { key: 'capsule', label: 'Capsule', icon: NAV_ICONS.capsule, color: '#D4537E', route: '/capsule', locked: !isPaired },
    { key: 'lists',   label: 'Lists',   icon: NAV_ICONS.lists,   color: '#10B981', route: '/lists',   locked: false },
    { key: 'dates',   label: 'Dates',   icon: NAV_ICONS.milestone, color: '#F59E0B', route: '/dates', locked: false },
  ];

  return (
    <ScreenShell variant="hero" className="flex-1">
      <NudgeOverlay />

      <ScrollView
        className="flex-1 px-4 pt-14"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar ─────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity
            className="w-11 h-11 bg-indigo-100 items-center justify-center rounded-full active:opacity-75"
            onPress={() => setIsDrawerOpen(true)}
          >
            <AppIcon name={NAV_ICONS.menu} size={24} color="#4F46E5" />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <DevBadge />
            <Text className="text-xs text-text-secondary">Welcome back</Text>
            <Text className="text-base font-extrabold text-text-primary capitalize leading-tight">
              {profile.display_name || user?.email?.split('@')[0]}
            </Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 bg-white border border-indigo-100 items-center justify-center rounded-full active:opacity-75 relative"
            onPress={() => router.push('/history')}
          >
            <AppIcon name="notifications-outline" size={20} color="#4F46E5" />
            <View className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </TouchableOpacity>
        </View>

        {/* ── Live Partner Widget ──────────────────────────────────── */}
        {isPaired && profile.couple_id && user?.id ? (
          <LivePartnerWidget coupleId={profile.couple_id} myId={user.id} partnerProfile={partnerProfile} />
        ) : null}

        {/* ── Hero Connection Card (Streak + Partner) ──────────────── */}
        <Card className="p-4 mb-4 border border-indigo-100 bg-indigo-50/40">
          <View className="flex-row items-center justify-between">
            {/* Left: streak */}
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-white border border-indigo-100 items-center justify-center">
                <AppIcon name={NAV_ICONS.streak} size={20} color="#4F46E5" />
              </View>
              <View>
                <Text className="text-2xs text-text-secondary">Relationship Streak</Text>
                <Text className="text-xl font-extrabold text-indigo-600">{coupleDetails?.streak || 0}
                  <Text className="text-sm font-semibold"> days</Text>
                </Text>
              </View>
            </View>

            {/* Right: partner pill or pair button */}
            {isPaired && partnerProfile ? (
              <View
                className="flex-row items-center gap-2 bg-white border border-indigo-100 rounded-xl px-3 py-2"
              >
                <ProfileAvatar uri={partnerProfile.avatar_url} name={partnerProfile.display_name} size={28} />
                <TouchableOpacity
                  onPress={() => router.push('/partner')}
                  className="active:opacity-75"
                >
                  <Text className="text-2xs font-bold text-text-primary capitalize" numberOfLines={1}>
                    {partnerProfile.display_name || 'Partner'}
                  </Text>
                  <Text className="text-3xs text-text-secondary">
                    {partnerMoodText ? `Feeling ${partnerMoodText}` : 'No mood set'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="bg-primary-600 rounded-xl px-4 py-2 active:bg-primary-500"
              >
                <Text className="text-white text-xs font-bold">Pair Partner</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-2xs text-text-secondary mt-3 leading-relaxed">
            {isPaired
              ? getAnniversaryText(coupleDetails?.created_at)
              : 'Pair with your partner to begin shared streaks and daily questions.'}
          </Text>
        </Card>

        {/* ── Daily Question Card ──────────────────────────────────── */}
        <Card className="p-5 mb-4 border border-indigo-100 bg-white">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-bold text-text-primary">Today's Daily Question</Text>
            {isPaired && (
              <View className={`px-2.5 py-1 rounded-full ${isDailyCompletedToday ? 'bg-green-100' : isDailyPending ? 'bg-orange-100' : 'bg-blue-100'}`}>
                <Text className={`text-2xs font-bold ${isDailyCompletedToday ? 'text-green-700' : isDailyPending ? 'text-orange-700' : 'text-blue-700'}`}>
                  {isDailyCompletedToday ? 'Completed ✨' : isDailyPending ? 'Pending 🎴' : 'Waiting ⏳'}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-sm text-text-secondary leading-relaxed mb-4">
            {isPaired
              ? isDailyCompletedToday
                ? "You've both answered today's question! Tap below to view your revealed answers."
                : isDailyPending
                  ? "Connect with your partner by answering today's shared question."
                  : "You've answered! Waiting for your partner to submit their response."
              : 'Pair with your partner first, then get a new shared question every single day.'}
          </Text>

          <View className="flex-row gap-3">
            {isPaired && (isDailyCompletedToday || hasAnsweredActive) ? (
              <>
                <TouchableOpacity
                  className="flex-1 bg-primary-600 rounded-xl h-12 items-center justify-center active:bg-primary-500"
                  onPress={() => router.push('/session/reveal')}
                  activeOpacity={0.85}
                >
                  <Text className="text-white text-sm font-bold">View Answers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary-100 rounded-xl h-12 items-center justify-center active:bg-blue-200"
                  onPress={() => router.push('/session/deck')}
                  activeOpacity={0.85}
                >
                  <Text className="text-primary-600 text-sm font-bold">Tackle New</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  className={`flex-1 bg-primary-600 rounded-xl h-12 items-center justify-center active:bg-primary-500 ${!isPaired ? 'opacity-60' : ''}`}
                  onPress={() => {
                    if (isPaired) router.push('/session/start');
                    else Alert.alert('Pairing Required', 'Pair with your partner in settings before opening.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text className="text-white text-sm font-bold">
                    {isDailyCompletedToday ? 'View Answers' : isDailyPending ? 'Answer Question' : 'Check Status'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary-100 rounded-xl h-12 items-center justify-center active:bg-blue-200"
                  onPress={() => setIsDrawerOpen(true)}
                  activeOpacity={0.85}
                >
                  <Text className="text-primary-600 text-sm font-bold">Open Menu</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Card>

        {/* ── Slim Quick-Access Strip ──────────────────────────────── */}
        <Card className="p-4 mb-4 border border-violet-50">
          <Text className="text-2xs font-bold text-text-secondary uppercase tracking-widest mb-3">Quick Access</Text>
          <View className="flex-row justify-between">
            {quickTiles.map((tile) => (
              <TouchableOpacity
                key={tile.key}
                onPress={() => {
                  if (tile.locked) {
                    Alert.alert('Locked', isPaired ? 'Complete more sessions to unlock this feature.' : 'Pair with your partner first.');
                    return;
                  }
                  router.push(tile.route as any);
                }}
                className="items-center flex-1 active:opacity-70"
                activeOpacity={0.8}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mb-1.5"
                  style={{ backgroundColor: tile.locked ? '#F1F5F9' : `${tile.color}18` }}
                >
                  <AppIcon name={tile.icon} size={22} color={tile.locked ? '#CBD5E1' : tile.color} />
                </View>
                <Text className={`text-2xs font-semibold ${tile.locked ? 'text-slate-300' : 'text-text-primary'}`}>
                  {tile.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Milestones + Health Row ──────────────────────────────── */}
        <View className="flex-row gap-3 mb-4">
          {/* Milestones */}
          <Card className="flex-1 p-4 border border-slate-100">
            <Text className="text-2xs font-bold text-text-secondary uppercase tracking-widest mb-2">Milestones</Text>
            <Text className="text-xl font-extrabold text-primary-600">
              {progress}
              <Text className="text-xs font-semibold text-text-secondary">/10</Text>
            </Text>
            <View className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2 mb-2">
              <View className="bg-primary-600 h-full rounded-full" style={{ width: `${(progress / 10) * 100}%` }} />
            </View>
            <Text className="text-3xs text-text-secondary leading-normal">
              {completedSessionsCount < 5
                ? `${5 - completedSessionsCount} until Journal`
                : completedSessionsCount < 10
                ? `${10 - completedSessionsCount} until Health`
                : 'All unlocked 🎉'}
            </Text>
          </Card>

          {/* Health */}
          <Card className="flex-1 p-4 border border-slate-100">
            <Text className="text-2xs font-bold text-text-secondary uppercase tracking-widest mb-2">Health</Text>
            <TouchableOpacity
              onPress={() =>
                handleLockedRoute(
                  '/health',
                  isHealthUnlocked,
                  `Complete 10 Daily Questions to unlock. Progress: ${completedSessionsCount}/10.`
                )
              }
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 rounded-xl bg-rose-50 items-center justify-center mb-1.5">
                <AppIcon name={NAV_ICONS.health} size={20} color={isHealthUnlocked ? '#D4537E' : '#CBD5E1'} />
              </View>
              <Text className={`text-xs font-bold ${isHealthUnlocked ? 'text-rose-600' : 'text-slate-300'}`}>
                {isHealthUnlocked ? 'View Report' : 'Locked'}
              </Text>
              {!isHealthUnlocked && (
                <Text className="text-3xs text-slate-300 mt-0.5">{completedSessionsCount}/10 sessions</Text>
              )}
            </TouchableOpacity>
          </Card>
        </View>

        {/* ── Recent Moments ───────────────────────────────────────── */}
        {isPaired && sessionHistory && sessionHistory.length > 0 ? (
          <View className="mb-8">
            <Text className="text-sm font-bold text-text-primary mb-3">Recent Moments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sessionHistory.slice(0, 5).map((session) => {
                const isUser1 = session.user1_id === user?.id;
                const myAnswer = isUser1 ? session.user1_answer : session.user2_answer;
                const partnerAnswer = isUser1 ? session.user2_answer : session.user1_answer;
                const myLabel = profile?.display_name || 'You';
                const partnerLabel = partnerProfile?.display_name || 'Partner';

                return (
                  <Card key={session.id} className="p-4 w-[240px] mr-3 border border-indigo-50">
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <View className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                      <Text className="text-2xs font-bold text-primary-600 uppercase tracking-wide">Revealed</Text>
                    </View>
                    <Text className="text-xs font-semibold text-text-primary mb-2 leading-relaxed" numberOfLines={2}>
                      "{session.cards?.text || 'Relationship Question'}"
                    </Text>
                    <View className="border-t border-slate-50 pt-2 gap-1">
                      <Text className="text-3xs text-text-secondary italic" numberOfLines={2}>
                        <Text className="font-semibold not-italic">{myLabel}: </Text>"{myAnswer || 'No answer'}"
                      </Text>
                      <Text className="text-3xs text-text-secondary italic" numberOfLines={2}>
                        <Text className="font-semibold not-italic">{partnerLabel}: </Text>"{partnerAnswer || 'No answer'}"
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Nudge FAB ───────────────────────────────────────────────── */}
      {isPaired ? (
        <TouchableOpacity
          className="absolute bottom-24 right-6 bg-primary-600 w-14 h-14 rounded-full justify-center items-center shadow-lg active:bg-primary-500 z-40"
          onPress={handleSendNudge}
          activeOpacity={0.8}
        >
          <AppIcon name={NAV_ICONS.nudge} size={26} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <BottomNav />

      {/* ── Sidebar Drawer ───────────────────────────────────────────── */}
      {drawerMounted ? (
        <View className="absolute inset-0 z-50 flex-row">
          <Animated.View
            onTouchStart={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950"
            style={backdropAnimatedStyle}
          />
          <Animated.View
            className="w-[300px] h-full bg-white px-5 pt-16 pb-8 shadow-2xl border-r border-indigo-50"
            style={drawerAnimatedStyle}
          >
            {/* Drawer header */}
            <View className="mb-5 pb-5 border-b border-indigo-50 flex-row items-center gap-3">
              <ProfileAvatar uri={profile.avatar_url} name={profile.display_name} size={48} isOwnAvatar={true} />
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xl font-bold text-text-primary">Menu</Text>
                  <TouchableOpacity
                    onPress={() => setIsDrawerOpen(false)}
                    className="bg-indigo-50 w-8 h-8 rounded-full items-center justify-center"
                  >
                    <AppIcon name={NAV_ICONS.close} size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-primary-600 font-semibold capitalize">
                  {profile.display_name || 'You'} · {isPaired ? `${coupleDetails?.streak || 0} day streak` : 'Unpaired'}
                </Text>
                <Text className="text-3xs text-text-secondary mt-1">
                  {isPaired ? getAnniversaryText(coupleDetails?.created_at) : 'Connect in settings'}
                </Text>
              </View>
            </View>

            {/* Drawer menu items */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="pb-5">
                {sidebarSections.map((section, secIdx) => (
                  <View key={section.title} className={secIdx > 0 ? 'mt-5' : ''}>
                    <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                      {section.title}
                    </Text>
                    <View className="gap-2">
                      {section.items.map((item) => (
                        <TouchableOpacity
                          key={item.label}
                          onPress={item.action}
                          className="py-2.5 px-3 rounded-xl border border-indigo-50/50 bg-indigo-50/10 active:bg-indigo-100 flex-row items-center gap-3"
                          activeOpacity={0.85}
                        >
                          <View className="w-8 h-8 rounded-lg bg-white items-center justify-center border border-indigo-50 shadow-2xs">
                            <AppIcon name={item.icon} size={16} color="#4F46E5" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-bold text-text-primary">{item.label}</Text>
                            <Text className="text-3xs text-text-secondary mt-0.5">{item.detail}</Text>
                          </View>
                          <AppIcon name={NAV_ICONS.chevron} size={14} color="#CBD5E1" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Sign out */}
            <View className="border-t border-slate-100 pt-4">
              <Button title="Sign Out" onPress={handleSignOut} variant="secondary" className="w-full" />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ScreenShell>
  );
}
