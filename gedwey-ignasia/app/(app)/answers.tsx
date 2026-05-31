import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import { groupAnswersByDay, useAllCoupleAnswers } from '../../lib/queries/gameAnswers';
import { useTheme } from '../../lib/hooks/useTheme';
import { CATEGORY_LABELS } from '../../lib/gamePrompts';

export default function AnswersArchiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile } = useUserProfile(profile?.partner_id ?? '');
  const { theme } = useTheme();
  const [filter, setFilter] = useState<'all' | 'game' | 'session'>('all');

  const { gameAnswers, sessionAnswers } = useAllCoupleAnswers(profile?.couple_id ?? '');

  const grouped = useMemo(() => {
    const all = groupAnswersByDay(
      gameAnswers.data ?? [],
      sessionAnswers.data ?? [],
      user?.id ?? '',
      profile?.display_name || 'You',
      partnerProfile?.display_name || 'Partner'
    );
    if (filter === 'all') return all;
    return all
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => (filter === 'game' ? i.source === 'game' : i.source === 'session')),
      }))
      .filter((g) => g.items.length > 0);
  }, [gameAnswers.data, sessionAnswers.data, filter, user?.id, profile?.display_name, partnerProfile?.display_name]);

  const isLoading = gameAnswers.isLoading || sessionAnswers.isLoading;

  return (
    <ScreenShell className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => router.back()} className="bg-indigo-100 px-3 py-2 rounded-xl flex-row items-center gap-1">
            <AppIcon name="arrow-back" size={16} color={theme.accent} />
            <Text className="text-sm font-bold" style={{ color: theme.accent }}>Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name={NAV_ICONS.session} size={22} color={theme.accent} />
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>All Answers</Text>
          </View>
          <View className="w-[58px]" />
        </View>

        <Text className="text-sm mb-4 leading-normal" style={{ color: theme.textSecondary }}>
          Every answer from games and sessions — visible to both of you, sorted by day and category.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {(['all', 'game', 'session'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              className="px-4 py-2 rounded-xl border mr-2"
              style={{
                backgroundColor: filter === item ? theme.accent : theme.surface,
                borderColor: filter === item ? theme.accent : theme.border,
              }}
            >
              <Text className="text-xs font-bold capitalize" style={{ color: filter === item ? '#fff' : theme.textSecondary }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!profile?.couple_id ? (
          <Card className="p-5">
            <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>Pair to see shared answers</Text>
            <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>Connect with your partner first.</Text>
          </Card>
        ) : isLoading ? (
          <Text className="text-sm text-center" style={{ color: theme.textSecondary }}>Loading answers...</Text>
        ) : grouped.length === 0 ? (
          <Card className="p-5 items-center">
            <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>No answers yet</Text>
            <Text className="text-sm text-center mt-1" style={{ color: theme.textSecondary }}>
              Play a game or complete a session — answers appear here for both of you.
            </Text>
          </Card>
        ) : (
          grouped.map((group) => (
            <View key={group.day} className="mb-6">
              <Text className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.accent }}>
                {group.day}
              </Text>
              {group.items.map((item) => (
                <Card key={item.id} className="p-4 mb-3">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.accentLight }}>
                      <Text className="text-[10px] font-bold capitalize" style={{ color: theme.accent }}>
                        {item.source === 'game' ? CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category : item.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-bold uppercase" style={{ color: theme.textTertiary }}>
                      {item.source}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold mb-3 leading-normal" style={{ color: theme.textPrimary }}>
                    {item.prompt}
                  </Text>
                  {item.answers.map((ans, idx) => (
                    <View key={idx} className="mb-2 last:mb-0 pl-3 border-l-2" style={{ borderColor: theme.accent + '60' }}>
                      <Text className="text-xs font-bold capitalize mb-0.5" style={{ color: theme.accent }}>
                        {ans.name}{ans.mood ? ` · ${ans.mood}` : ''}
                      </Text>
                      <Text className="text-sm leading-normal" style={{ color: theme.textSecondary }}>
                        {ans.answer}
                      </Text>
                    </View>
                  ))}
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
