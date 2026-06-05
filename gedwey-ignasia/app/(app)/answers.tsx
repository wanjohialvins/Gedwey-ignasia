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
import { groupAnswersByDay, useAllCoupleAnswers, usePendingSessionsForMe, usePendingGamePromptsForMe } from '../../lib/queries/gameAnswers';
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
  const { data: pendingSessions = [] } = usePendingSessionsForMe(profile?.couple_id ?? '', user?.id ?? '');
  const { data: pendingGamePrompts = [] } = usePendingGamePromptsForMe(profile?.couple_id ?? '', user?.id ?? '');

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
            <AppIcon name={NAV_ICONS.session} size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Answers Hub</Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="text-xs text-text-secondary leading-relaxed mb-5 px-1">
          Every answer from games and sessions — visible to both of you, sorted by day and category.
        </Text>

        {/* ── Your Turn Section ────────────────────────────────────── */}
        {(pendingSessions.length > 0 || pendingGamePrompts.length > 0) && (
          <View className="mb-6">
            <Text className="text-3xs font-extrabold text-indigo-600 uppercase tracking-widest mb-3 px-1">
              Your Turn 🎯
            </Text>
            {pendingSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => router.push('/session/card')}
                className="mb-3 active:opacity-90"
                activeOpacity={0.9}
              >
                <Card className="p-4 border border-rose-100 bg-rose-50/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="px-2 py-0.5 rounded bg-rose-100">
                      <Text className="text-[9px] font-extrabold text-rose-700 uppercase tracking-wide">
                        Session · {session.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-bold text-rose-500">Answer Now</Text>
                  </View>
                  <Text className="text-sm font-bold text-text-primary px-0.5 leading-normal">
                    "{session.prompt}"
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
            {pendingGamePrompts.map((game) => (
              <TouchableOpacity
                key={game.gameCardId}
                onPress={() => router.push('/games')}
                className="mb-3 active:opacity-90"
                activeOpacity={0.9}
              >
                <Card className="p-4 border border-pink-100 bg-pink-50/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="px-2 py-0.5 rounded bg-pink-100">
                      <Text className="text-[9px] font-extrabold text-pink-700 uppercase tracking-wide">
                        Game · {CATEGORY_LABELS[game.category as keyof typeof CATEGORY_LABELS] || game.category}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-bold text-pink-500">Answer Now</Text>
                  </View>
                  <Text className="text-sm font-bold text-text-primary px-0.5 leading-normal">
                    "{game.prompt}"
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Tabs Selector ────────────────────────────────────────── */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200/50">
          {(['all', 'game', 'session'] as const).map((item) => {
            const active = filter === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFilter(item)}
                className={`flex-1 py-2 rounded-lg items-center capitalize ${active ? 'bg-white shadow-xs' : ''}`}
                activeOpacity={0.8}
              >
                <Text className={`text-2xs font-extrabold ${active ? 'text-primary-600' : 'text-text-secondary'}`}>
                  {item === 'all' ? 'All Activities' : `${item}s`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Responses List ───────────────────────────────────────── */}
        {!profile?.couple_id ? (
          <Card className="p-5 border border-indigo-50/60">
            <Text className="text-sm font-bold text-text-primary">Pair to see shared answers</Text>
            <Text className="text-xs text-text-secondary mt-1">Connect with your partner first in settings.</Text>
          </Card>
        ) : isLoading ? (
          <View className="py-8 items-center">
            <Text className="text-xs text-text-secondary italic">Loading shared archive...</Text>
          </View>
        ) : grouped.length === 0 ? (
          <Card className="p-6 items-center border border-indigo-50/60">
            <Text className="text-sm font-bold text-text-primary">No answers yet</Text>
            <Text className="text-xs text-center text-text-secondary mt-1.5 leading-relaxed">
              Play a game or complete a session — answers will automatically appear here for both of you.
            </Text>
          </Card>
        ) : (
          grouped.map((group) => (
            <View key={group.day} className="mb-6">
              <Text className="text-3xs font-extrabold text-primary-600 uppercase tracking-widest mb-3.5 px-1">
                {group.day}
              </Text>
              {group.items.map((item) => (
                <Card key={item.id} className="p-4 mb-4 border border-indigo-50/40 bg-white">
                  <View className="flex-row items-center gap-2 mb-2.5">
                    <View className="px-2 py-0.5 rounded-md bg-indigo-55/10 bg-indigo-50">
                      <Text className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide">
                        {item.source === 'game' ? CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category : item.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">
                      {item.source}
                    </Text>
                  </View>
                  
                  <Text className="text-sm font-bold text-text-primary mb-4 leading-normal px-0.5">
                    "{item.prompt}"
                  </Text>
                  
                  <View className="gap-3 border-l-2 border-indigo-100 pl-3">
                    {item.answers.map((ans, idx) => (
                      <View key={idx} className="mb-1 last:mb-0">
                        <Text className="text-3xs font-bold text-primary-600 uppercase tracking-wider mb-0.5">
                          {ans.name}{ans.mood ? ` · ${ans.mood}` : ''}
                        </Text>
                        <Text className="text-xs text-text-secondary leading-relaxed">
                          {ans.answer}
                        </Text>
                      </View>
                    ))}
                  </View>
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
