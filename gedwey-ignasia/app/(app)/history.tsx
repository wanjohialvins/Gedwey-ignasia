import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS, type IconName } from '../../lib/navigationIcons';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import { useActivityLogs } from '../../lib/queries/engagement';
import { useTheme } from '../../lib/hooks/useTheme';
import { ThemedText } from '../../components/ThemedText';
import { formatWeekdayMonthDay } from '../../lib/dateUtils';
import { usePendingSessionsForMe, usePendingGamePromptsForMe } from '../../lib/queries/gameAnswers';

const ACTIVITY_ICONS: Record<string, { icon: IconName; color: string; iconColor: string }> = {
  session: { icon: NAV_ICONS.session, color: 'bg-violet-100', iconColor: '#7C3AED' },
  game: { icon: NAV_ICONS.games, color: 'bg-pink-100', iconColor: '#DB2777' },
  todo: { icon: NAV_ICONS.lists, color: 'bg-sky-100', iconColor: '#0284C7' },
  bucket: { icon: NAV_ICONS.bucket, color: 'bg-emerald-100', iconColor: '#059669' },
  music: { icon: NAV_ICONS.music, color: 'bg-indigo-100', iconColor: '#4F46E5' },
  profile: { icon: NAV_ICONS.profile, color: 'bg-slate-100', iconColor: '#64748B' },
  voice: { icon: 'mic-outline', color: 'bg-fuchsia-100', iconColor: '#C026D3' },
  cycle: { icon: NAV_ICONS.health, color: 'bg-rose-100', iconColor: '#E11D48' },
  health: { icon: NAV_ICONS.health, color: 'bg-rose-100', iconColor: '#E11D48' },
};

const formatDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatWeekdayMonthDay(date, 'short');
};

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile } = useUserProfile(profile?.partner_id ?? '');
  const [filter, setFilter] = useState('all');
  const { data: logs = [] } = useActivityLogs(
    profile?.couple_id ?? '',
    filter === 'yet-to-do' ? 'all' : filter
  );

  const { data: pendingSessions = [] } = usePendingSessionsForMe(profile?.couple_id ?? '', user?.id ?? '');
  const { data: pendingGamePrompts = [] } = usePendingGamePromptsForMe(profile?.couple_id ?? '', user?.id ?? '');

  const yetToDoItems = useMemo(() => {
    if (filter !== 'yet-to-do') return [];
    const sessions = pendingSessions.map((s) => ({
      id: s.id,
      type: 'session' as const,
      prompt: s.prompt,
      category: s.category,
      timestamp: s.partnerAnsweredAt,
      route: '/session/card' as const,
    }));
    const games = pendingGamePrompts.map((g) => ({
      id: g.gameCardId,
      type: 'game' as const,
      prompt: g.prompt,
      category: g.category,
      timestamp: g.partnerAnsweredAt,
      route: '/games' as const,
    }));
    return [...sessions, ...games].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [pendingSessions, pendingGamePrompts, filter]);

  const nameForUser = (userId: string | null, log?: { profiles?: { display_name: string | null } | null }) => {
    if (log?.profiles?.display_name) return log.profiles.display_name;
    if (!userId) return 'Unknown';
    if (userId === user?.id) return profile?.display_name || 'You';
    return partnerProfile?.display_name || 'Partner';
  };

  const handleItemPress = (activityType: string, metadata: any) => {
    switch (activityType) {
      case 'session':
        router.push('/session/reveal');
        break;
      case 'game':
        if (metadata && metadata.catCare) {
          router.push('/cat-care');
        } else {
          router.push('/games');
        }
        break;
      case 'todo':
        router.push({ pathname: '/lists', params: { tab: 'todo' } } as any);
        break;
      case 'bucket':
        router.push({ pathname: '/lists', params: { tab: 'bucket' } } as any);
        break;
      case 'music':
        router.push('/music');
        break;
      case 'journal':
        router.push('/journal');
        break;
      case 'capsule':
        router.push('/capsule');
        break;
      case 'cycle':
      case 'health':
        router.push('/health');
        break;
      default:
        break;
    }
  };

  const grouped = useMemo(() => {
    return logs.reduce<Record<string, typeof logs>>((acc, log) => {
      const day = formatDayLabel(log.created_at);
      const hour = new Date(log.created_at).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
      const key = `${day} • ${hour}`;
      acc[key] = acc[key] || [];
      acc[key].push(log);
      return acc;
    }, {});
  }, [logs]);

  return (
    <ScreenShell variant="hero" className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* ── Standardized Header ───────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-indigo-50/60 items-center justify-center rounded-full active:opacity-75"
          >
            <AppIcon name="arrow-back" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name="notifications-outline" size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Timeline Logs</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* ── Filters Horizontal Scroll Bar ────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {['all', 'yet-to-do', 'session', 'game', 'todo', 'bucket', 'music'].map((item) => {
            const active = filter === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFilter(item)}
                className={`px-4 py-1.5 rounded-full border mr-2 active:opacity-85 ${
                  active ? 'bg-primary-600 border-primary-600' : 'bg-white border-indigo-50/60'
                }`}
              >
                <Text
                  className={`text-3xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-text-secondary'}`}
                >
                  {item === 'yet-to-do' ? 'Yet To Do' : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Timeline List ────────────────────────────────────────── */}
        {!profile?.couple_id ? (
          <Card className="p-5 border border-indigo-50/60 bg-white">
            <Text className="text-sm font-bold text-text-primary">Pair to start logging</Text>
            <Text className="text-xs text-text-secondary mt-1">
              Your shared timeline will appear after you connect with a partner.
            </Text>
          </Card>
        ) : filter === 'yet-to-do' ? (
          yetToDoItems.length > 0 ? (
            yetToDoItems.map((item) => {
              const meta = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.profile;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  className="active:opacity-90 mb-3"
                  activeOpacity={0.9}
                >
                  <Card className="p-4 border border-rose-100 bg-rose-50/10">
                    <View className="flex-row items-center gap-3.5">
                      <View className={`w-9 h-9 rounded-xl items-center justify-center ${meta.color} border border-white`}>
                        <AppIcon name={meta.icon} size={18} color={meta.iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-text-primary leading-normal">"{item.prompt}"</Text>
                        <Text className="text-3xs text-rose-500 font-extrabold mt-1 uppercase tracking-wide">
                          {item.type} · Partner answered · Your Turn
                        </Text>
                      </View>
                      <AppIcon name={NAV_ICONS.chevron} size={14} color="#FDA4AF" />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <Card className="p-6 items-center border border-indigo-50/60 bg-white">
              <AppIcon name="checkmark-circle-outline" size={28} color="#10B981" />
              <Text className="text-sm font-bold text-text-primary mt-3">All caught up!</Text>
              <Text className="text-xs text-center text-text-secondary mt-1.5 leading-relaxed">
                You've answered all of your partner's active prompts. Nice job!
              </Text>
            </Card>
          )
        ) : Object.keys(grouped).length ? (
          Object.entries(grouped).map(([hour, items]) => (
            <View key={hour} className="mb-5">
              <Text className="text-3xs font-extrabold text-primary-600 uppercase tracking-widest mb-3 px-1">{hour}</Text>
              {items.map((item) => {
                const meta = ACTIVITY_ICONS[item.activity_type] || ACTIVITY_ICONS.profile;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemPress(item.activity_type, item.metadata)}
                    className="active:opacity-90 mb-3"
                    activeOpacity={0.9}
                  >
                    <Card className="p-4 border border-indigo-50/40 bg-white">
                      <View className="flex-row items-center gap-3.5">
                        <View className={`w-9 h-9 rounded-xl items-center justify-center ${meta.color} border border-white`}>
                          <AppIcon name={meta.icon} size={18} color={meta.iconColor} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-text-primary leading-normal">{item.title}</Text>
                          <Text className="text-3xs text-text-secondary font-semibold mt-1 uppercase tracking-wide">
                            {item.activity_type} · By {nameForUser(item.user_id, item)}
                          </Text>
                        </View>
                        <AppIcon name={NAV_ICONS.chevron} size={14} color="#CBD5E1" />
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        ) : (
          <Card className="p-6 items-center border border-indigo-50/60 bg-white">
            <AppIcon name="notifications-outline" size={28} color="#94A3B8" />
            <Text className="text-sm font-bold text-text-primary mt-3">No activity logs yet</Text>
            <Text className="text-xs text-center text-text-secondary mt-1.5 leading-relaxed">
              Games, lists, sessions, and shared music updates will appear here.
            </Text>
          </Card>
        )}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
