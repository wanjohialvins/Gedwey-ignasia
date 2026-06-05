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
  const { data: logs = [] } = useActivityLogs(profile?.couple_id ?? '', filter);

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
    <ScreenShell className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ backgroundColor: theme.accentLight }}
            className="px-3 py-2 rounded-xl flex-row items-center gap-1 active:opacity-80"
          >
            <AppIcon name="arrow-back" size={16} color={theme.accent} />
            <Text style={{ color: theme.accent }} className="text-sm font-bold">Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name="notifications-outline" size={22} color={theme.accent} />
            <ThemedText className="text-xl font-bold">Notifications</ThemedText>
          </View>
          <View className="w-[58px]" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {['all', 'session', 'game', 'todo', 'bucket', 'music'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              style={{
                backgroundColor: filter === item ? theme.accent : theme.surface,
                borderColor: filter === item ? theme.accent : theme.border,
              }}
              className="px-4 py-2 rounded-xl border mr-2 active:opacity-80"
            >
              <Text 
                style={{ color: filter === item ? '#fff' : theme.textSecondary }}
                className="text-xs font-bold capitalize"
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!profile?.couple_id ? (
          <Card className="p-5">
            <ThemedText className="text-base font-bold mb-1">Pair to start logging</ThemedText>
            <ThemedText type="secondary" className="text-sm leading-normal">
              Your shared timeline appears after you connect with a partner.
            </ThemedText>
          </Card>
        ) : Object.keys(grouped).length ? (
          Object.entries(grouped).map(([hour, items]) => (
            <View key={hour} className="mb-5">
              <Text style={{ color: theme.accent }} className="text-xs font-bold uppercase tracking-widest mb-2">{hour}</Text>
              {items.map((item) => {
                const meta = ACTIVITY_ICONS[item.activity_type] || ACTIVITY_ICONS.profile;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemPress(item.activity_type, item.metadata)}
                    className="active:opacity-80 mb-2"
                  >
                    <Card className="p-4">
                      <View className="flex-row items-start gap-3">
                        <View className={`w-9 h-9 rounded-full items-center justify-center ${meta.color}`}>
                          <AppIcon name={meta.icon} size={18} color={meta.iconColor} />
                        </View>
                        <View className="flex-1">
                          <ThemedText className="text-sm font-bold">{item.title}</ThemedText>
                          <ThemedText type="secondary" className="text-xs mt-1 capitalize">
                            {item.activity_type} · by {nameForUser(item.user_id, item)}
                          </ThemedText>
                        </View>
                        <View style={{ alignSelf: 'center' }}>
                          <AppIcon name={NAV_ICONS.chevron} size={14} color={theme.textTertiary} />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        ) : (
          <Card className="p-5 items-center">
            <AppIcon name="notifications-outline" size={32} color={theme.textTertiary} />
            <ThemedText className="text-base font-bold mb-1 mt-3">No activity logs yet</ThemedText>
            <ThemedText type="secondary" className="text-sm leading-normal text-center">
              Games, lists, sessions, and music will appear here.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
