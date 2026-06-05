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
import { NAV_ICONS, QUICK_TILES } from '../../lib/navigationIcons';
import { useTheme } from '../../lib/hooks/useTheme';
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
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }}>
        <View className="mb-6 flex-row items-center gap-3">
          <Skeleton width={44} height={44} variant="circle" />
          <View>
            <Skeleton width={140} height={20} className="mb-2" />
            <Skeleton width={90} height={14} />
          </View>
        </View>
        {[1, 2, 3].map((item) => (
          <View key={item} className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm mb-5">
            <Skeleton width={150} height={20} className="mb-3" />
            <Skeleton width="100%" height={48} className="rounded-xl" />
          </View>
        ))}
      </ScrollView>
    );
  }

  const partnerMoodText = getPartnerMoodText();
  const progress = Math.min(completedSessionsCount, 10);

  type SidebarRow = { label: string; detail: string; icon: typeof NAV_ICONS.dashboard; action: () => void };

  const sidebarItems: SidebarRow[] = [
    { label: 'Dashboard', detail: 'Home summary', icon: NAV_ICONS.dashboard, action: () => navigateFromDrawer('/') },
    ...(!isPaired
      ? [{ label: 'Discovery Mode', detail: 'Share and compare answers', icon: NAV_ICONS.discovery, action: () => navigateFromDrawer('/discovery') }]
      : []),
    {
      label: 'Couple Sessions',
      detail: 'Daily question cards',
      icon: NAV_ICONS.session,
      action: () => {
        if (isPaired) navigateFromDrawer('/session/start');
        else Alert.alert('Pairing Required', 'Pair with your partner before starting sessions.');
      },
    },
    { label: 'Games', detail: 'Truth or Dare and more', icon: NAV_ICONS.games, action: () => navigateFromDrawer('/games') },
    { label: 'Cat Care', detail: 'Daily streak tasks', icon: NAV_ICONS.play, action: () => navigateFromDrawer('/cat-care') },
    { label: 'All Answers', detail: 'Shared game & session answers', icon: NAV_ICONS.session, action: () => navigateFromDrawer('/answers') },
    { label: 'Cycle Calendar', detail: 'Period & mood tracking', icon: NAV_ICONS.health, action: () => navigateFromDrawer('/cycle') },
    { label: 'Important Dates', detail: 'Anniversaries & milestones', icon: NAV_ICONS.milestone, action: () => navigateFromDrawer('/dates') },
    { label: 'Partner Profile', detail: partnerProfile?.display_name || 'View partner', icon: NAV_ICONS.partner, action: () => navigateFromDrawer('/partner') },
    { label: 'Shared Lists', detail: 'To-dos and bucket goals', icon: NAV_ICONS.lists, action: () => navigateFromDrawer('/lists') },
    { label: 'Music', detail: 'Our soundtrack', icon: NAV_ICONS.music, action: () => navigateFromDrawer('/music') },
    { label: 'History', detail: 'Activity timeline', icon: NAV_ICONS.history, action: () => navigateFromDrawer('/history') },
    {
      label: 'Shared Journal',
      detail: isJournalUnlocked ? 'Private memories' : `Unlock ${completedSessionsCount}/5`,
      icon: NAV_ICONS.journal,
      action: () =>
        handleLockedRoute(
          '/journal',
          isJournalUnlocked,
          `Complete 5 sessions to unlock your shared journal. Progress: ${completedSessionsCount}/5.`
        ),
    },
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
    {
      label: 'Relationship Health',
      detail: isHealthUnlocked ? 'Weekly alignment' : `Unlock ${completedSessionsCount}/10`,
      icon: NAV_ICONS.health,
      action: () =>
        handleLockedRoute(
          '/health',
          isHealthUnlocked,
          `Complete 10 sessions to unlock relationship health. Progress: ${completedSessionsCount}/10.`
        ),
    },
    { label: 'Settings', detail: 'Profile and pairing', icon: NAV_ICONS.settings, action: () => navigateFromDrawer('/settings') },
  ];

  return (
    <ScreenShell variant="hero" className="flex-1">
      <NudgeOverlay />

      <ScrollView className="flex-1 px-4 pt-14" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            className="w-11 h-11 bg-indigo-100 items-center justify-center rounded-full active:opacity-75"
            onPress={() => setIsDrawerOpen(true)}
          >
            <AppIcon name={NAV_ICONS.menu} size={24} color="#4F46E5" />
          </TouchableOpacity>
          <View className="flex-1 ml-3 flex-row items-center gap-2">
            <ProfileAvatar uri={profile.avatar_url} name={profile.display_name} size={44} />
            {isPaired && partnerProfile ? (
              <ProfileAvatar uri={partnerProfile.avatar_url} name={partnerProfile.display_name} size={44} />
            ) : null}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <DevBadge />
              </View>
              <Text className="text-sm font-semibold text-text-secondary mt-1">Welcome</Text>
              <Text className="text-base font-bold text-text-primary capitalize">
                {profile.display_name || user?.email?.split('@')[0]}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-white border border-indigo-100 items-center justify-center rounded-full active:opacity-75 relative"
            onPress={() => router.push('/history')}
          >
            <AppIcon name="notifications-outline" size={20} color="#4F46E5" />
            <View className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </TouchableOpacity>
        </View>

        {isPaired && profile.couple_id && user?.id ? (
          <LivePartnerWidget coupleId={profile.couple_id} myId={user.id} partnerProfile={partnerProfile} />
        ) : null}

        <Card className="p-5 mb-5 border border-indigo-100 bg-indigo-50/40">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <AppIcon name={NAV_ICONS.streak} size={20} color="#4F46E5" />
              <Text className="text-sm font-bold text-text-primary">Relationship Streak</Text>
            </View>
            <Text className="text-lg font-bold text-indigo-600">{coupleDetails?.streak || 0} days</Text>
          </View>
          <Text className="text-xs text-text-secondary leading-normal">
            {isPaired ? getAnniversaryText(coupleDetails?.created_at) : 'Pair with your partner to begin shared streaks and sessions.'}
          </Text>
        </Card>

        <Card className="p-5 mb-5">
          <Text className="text-sm font-bold text-text-primary mb-3">Today</Text>
          <Text className="text-sm text-text-secondary leading-normal mb-4">
            {isPaired
              ? 'Start one focused moment together, or open the menu for every feature.'
              : 'Pair with your partner first, then all shared spaces open from the menu.'}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 bg-primary-600 rounded-xl h-12 items-center justify-center active:bg-primary-500 ${!isPaired ? 'opacity-60' : ''}`}
              onPress={() => {
                if (isPaired) router.push('/session/start');
                else Alert.alert('Pairing Required', 'Pair with your partner in settings before starting sessions.');
              }}
              activeOpacity={0.85}
            >
              <Text className="text-white text-sm font-bold">Start Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary-100 rounded-xl h-12 items-center justify-center active:bg-blue-200"
              onPress={() => setIsDrawerOpen(true)}
              activeOpacity={0.85}
            >
              <Text className="text-primary-600 text-sm font-bold">Open Menu</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card className="p-5 mb-5 border-violet-50">
          <Text className="text-sm font-bold text-text-primary mb-3">Quick Access</Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_TILES.map((tile) => {
              const locked =
                ('requiresPair' in tile && tile.requiresPair && !isPaired) ||
                ('milestone' in tile && tile.milestone === 10 && !isHealthUnlocked);
              return (
                <TouchableOpacity
                  key={tile.key}
                  onPress={() => {
                    if (locked) {
                      Alert.alert(
                        'Locked',
                        isPaired ? 'Complete more sessions to unlock this feature.' : 'Pair with your partner first.'
                      );
                      return;
                    }
                    if ('params' in tile && tile.params) {
                      router.push({ pathname: tile.route, params: tile.params } as any);
                    } else {
                      router.push(tile.route as any);
                    }
                  }}
                  className={`w-[47%] ${tile.color} border border-white/80 rounded-2xl p-4 active:opacity-80`}
                >
                  <View className="w-9 h-9 rounded-xl bg-white/80 items-center justify-center mb-2">
                    <AppIcon name={tile.icon} size={20} color={tile.iconColor} />
                  </View>
                  <Text className="text-sm font-bold text-text-primary">{tile.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card className="p-5 mb-5">
          <Text className="text-sm font-bold text-text-primary mb-3">Partner Status</Text>
          {isPaired ? (
            <TouchableOpacity onPress={() => router.push('/partner')} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-row items-center gap-3">
              <ProfileAvatar uri={partnerProfile?.avatar_url} name={partnerProfile?.display_name} size={40} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text-primary capitalize">{partnerProfile?.display_name || 'Partner'}</Text>
                <Text className="text-xs text-text-secondary mt-1">
                  {partnerMoodText ? `Feeling ${partnerMoodText}` : 'No daily mood set yet'}
                </Text>
              </View>
              <AppIcon name={NAV_ICONS.chevron} size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ) : (
            <Button title="Pair with Partner" variant="secondary" onPress={() => router.push('/settings')} className="w-full" />
          )}
        </Card>

        <Card className="p-5 mb-5">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold text-text-primary">Milestones</Text>
            <Text className="text-xs font-bold text-primary-600">{progress}/10</Text>
          </View>
          <View className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <View className="bg-primary-600 h-full rounded-full" style={{ width: `${(progress / 10) * 100}%` }} />
          </View>
          <Text className="text-xs text-text-secondary mt-3">
            {completedSessionsCount < 5
              ? `${5 - completedSessionsCount} sessions until Shared Journal`
              : completedSessionsCount < 10
              ? `${10 - completedSessionsCount} sessions until Relationship Health`
              : 'All primary milestones are available'}
          </Text>
        </Card>

        {isPaired && sessionHistory && sessionHistory.length > 0 ? (
          <View className="mb-8">
            <Text className="text-base font-bold text-text-primary mb-3">Recent Moments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sessionHistory.slice(0, 5).map((session) => {
                const isUser1 = session.user1_id === user?.id;
                const myAnswer = isUser1 ? session.user1_answer : session.user2_answer;
                const partnerAnswer = isUser1 ? session.user2_answer : session.user1_answer;
                const myLabel = profile?.display_name || 'You';
                const partnerLabel = partnerProfile?.display_name || 'Partner';

                return (
                  <Card key={session.id} className="p-4 w-[260px] mr-3">
                    <Text className="text-xs font-semibold text-primary-600 mb-2">Revealed</Text>
                    <Text className="text-xs font-medium text-text-primary mb-2" numberOfLines={2}>
                      "{session.cards?.text || 'Relationship Question'}"
                    </Text>
                    <Text className="text-3xs text-text-secondary italic mb-1" numberOfLines={2}>
                      {myLabel}: "{myAnswer || 'No answer'}"
                    </Text>
                    <Text className="text-3xs text-text-secondary italic" numberOfLines={2}>
                      {partnerLabel}: "{partnerAnswer || 'No answer'}"
                    </Text>
                  </Card>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

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

      {drawerMounted ? (
        <View className="absolute inset-0 z-50 flex-row">
          <Animated.View onTouchStart={() => setIsDrawerOpen(false)} className="absolute inset-0 bg-slate-950" style={backdropAnimatedStyle} />
          <Animated.View className="w-[300px] h-full bg-white px-5 pt-16 pb-8 shadow-2xl border-r border-indigo-50" style={drawerAnimatedStyle}>
            <View className="mb-5 pb-5 border-b border-indigo-50 flex-row items-center gap-3">
              <ProfileAvatar uri={profile.avatar_url} name={profile.display_name} size={48} />
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xl font-bold text-text-primary">Menu</Text>
                  <TouchableOpacity onPress={() => setIsDrawerOpen(false)} className="bg-indigo-50 w-8 h-8 rounded-full items-center justify-center">
                    <AppIcon name={NAV_ICONS.close} size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-primary-600 font-semibold capitalize">
                  {profile.display_name || 'You'} · {isPaired ? `${coupleDetails?.streak || 0} day streak` : 'Unpaired'}
                </Text>
                <Text className="text-3xs text-text-secondary mt-1">{isPaired ? getAnniversaryText(coupleDetails?.created_at) : 'Connect in settings'}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="gap-2 pb-5">
                {sidebarItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.action}
                    className="py-3 px-3.5 rounded-xl border border-indigo-50 bg-indigo-50/30 active:bg-indigo-100 flex-row items-center gap-3"
                    activeOpacity={0.85}
                  >
                    <View className="w-9 h-9 rounded-xl bg-white items-center justify-center border border-indigo-100">
                      <AppIcon name={item.icon} size={18} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-text-primary">{item.label}</Text>
                      <Text className="text-2xs text-text-secondary mt-0.5">{item.detail}</Text>
                    </View>
                    <AppIcon name={NAV_ICONS.chevron} size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="border-t border-slate-100 pt-4">
              <Button title="Sign Out" onPress={handleSignOut} variant="secondary" className="w-full" />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ScreenShell>
  );
}
