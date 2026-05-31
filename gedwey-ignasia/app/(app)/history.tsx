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

const ACTIVITY_ICONS: Record<string, { icon: IconName; color: string; iconColor: string }> = {
  session: { icon: NAV_ICONS.session, color: 'bg-violet-100', iconColor: '#7C3AED' },
  game: { icon: NAV_ICONS.games, color: 'bg-pink-100', iconColor: '#DB2777' },
  todo: { icon: NAV_ICONS.lists, color: 'bg-sky-100', iconColor: '#0284C7' },
  bucket: { icon: NAV_ICONS.bucket, color: 'bg-emerald-100', iconColor: '#059669' },
  music: { icon: NAV_ICONS.music, color: 'bg-indigo-100', iconColor: '#4F46E5' },
  profile: { icon: NAV_ICONS.profile, color: 'bg-slate-100', iconColor: '#64748B' },
  voice: { icon: 'mic-outline', color: 'bg-fuchsia-100', iconColor: '#C026D3' },
};

const formatDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
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
          <TouchableOpacity onPress={() => router.back()} className="bg-indigo-100 px-3 py-2 rounded-xl flex-row items-center gap-1">
            <AppIcon name="arrow-back" size={16} color="#4F46E5" />
            <Text className="text-sm font-bold text-indigo-600">Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name={NAV_ICONS.history} size={22} color="#4F46E5" />
            <Text className="text-xl font-bold text-text-primary">History</Text>
          </View>
          <View className="w-[58px]" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {['all', 'session', 'game', 'todo', 'bucket', 'music'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              className={`px-4 py-2 rounded-xl border mr-2 ${filter === item ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-neutral-border'}`}
            >
              <Text className={`text-xs font-bold capitalize ${filter === item ? 'text-white' : 'text-text-secondary'}`}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!profile?.couple_id ? (
          <Card className="p-5">
            <Text className="text-base font-bold text-text-primary mb-1">Pair to start logging</Text>
            <Text className="text-sm text-text-secondary leading-normal">Your shared timeline appears after you connect with a partner.</Text>
          </Card>
        ) : Object.keys(grouped).length ? (
          Object.entries(grouped).map(([hour, items]) => (
            <View key={hour} className="mb-5">
              <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{hour}</Text>
              {items.map((item) => {
                const meta = ACTIVITY_ICONS[item.activity_type] || ACTIVITY_ICONS.profile;
                return (
                  <Card key={item.id} className="p-4 mb-2">
                    <View className="flex-row items-start gap-3">
                      <View className={`w-9 h-9 rounded-full items-center justify-center ${meta.color}`}>
                        <AppIcon name={meta.icon} size={18} color={meta.iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-text-primary">{item.title}</Text>
                        <Text className="text-xs text-text-secondary mt-1 capitalize">
                          {item.activity_type} · added by {nameForUser(item.user_id, item)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ))
        ) : (
          <Card className="p-5 items-center">
            <AppIcon name={NAV_ICONS.history} size={32} color="#94A3B8" />
            <Text className="text-base font-bold text-text-primary mb-1 mt-3">No logs yet</Text>
            <Text className="text-sm text-text-secondary leading-normal text-center">Games, lists, sessions, and music will appear here.</Text>
          </Card>
        )}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
