import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { BUCKET_LIST_STARTERS } from '../../lib/gamePrompts';
import { useCreateSharedItem, useLogActivity, useSharedItems, useToggleSharedItem } from '../../lib/queries/engagement';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';

export default function ListsScreen() {
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  const [tab, setTab] = useState<'todo' | 'bucket'>('todo');
  const [title, setTitle] = useState('');
  const { data: items = [] } = useSharedItems(coupleId, tab);
  const createItem = useCreateSharedItem();
  const toggleItem = useToggleSharedItem();
  const logActivity = useLogActivity();

  useEffect(() => {
    if (tabParam === 'bucket' || tabParam === 'todo') {
      setTab(tabParam);
    }
  }, [tabParam]);

  const addItem = async () => {
    if (!coupleId || !user?.id) {
      Alert.alert('Pairing Required', 'Connect with a partner before creating shared lists.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Add a title', 'Enter a task or bucket goal first.');
      return;
    }
    try {
      const item = await createItem.mutateAsync({ coupleId, userId: user.id, itemType: tab, title: title.trim() });
      await logActivity.mutateAsync({
        coupleId,
        userId: user.id,
        activityType: tab,
        title: `Added ${tab === 'todo' ? 'task' : 'bucket goal'}: ${item.title}`,
      });
      setTitle('');
    } catch (err: any) {
      Alert.alert('Could not add', err.message || 'Try again.');
    }
  };

  const addStarter = async (starter: string) => {
    if (!coupleId || !user?.id) {
      Alert.alert('Pairing Required', 'Connect with a partner before creating shared lists.');
      return;
    }
    if (items.some((item) => item.title === starter)) return;
    try {
      await createItem.mutateAsync({ coupleId, userId: user.id, itemType: 'bucket', title: starter });
      await logActivity.mutateAsync({
        coupleId,
        userId: user.id,
        activityType: 'bucket',
        title: `Added bucket goal: ${starter}`,
      });
    } catch (err: any) {
      Alert.alert('Could not add', err.message || 'Try again.');
    }
  };

  const onToggle = async (item: (typeof items)[0]) => {
    try {
      await toggleItem.mutateAsync(item);
      if (!item.completed && profile?.couple_id && user?.id) {
        await logActivity.mutateAsync({
          coupleId: profile.couple_id,
          userId: user.id,
          activityType: tab,
          title: `Completed ${tab === 'todo' ? 'task' : 'goal'}: ${item.title}`,
        });
      }
    } catch (err: any) {
      Alert.alert('Update failed', err.message || 'Try again.');
    }
  };

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
            <AppIcon name={tab === 'bucket' ? NAV_ICONS.bucket : NAV_ICONS.lists} size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Shared Lists</Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="text-xs text-text-secondary leading-relaxed mb-5 px-1">
          Track shared daily tasks and exciting future goals in real-time.
        </Text>

        {/* ── Tabs Selector ────────────────────────────────────────── */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200/50">
          {(['todo', 'bucket'] as const).map((item) => {
            const active = tab === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item)}
                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center gap-2 ${active ? 'bg-white shadow-xs' : ''}`}
                activeOpacity={0.85}
              >
                <AppIcon
                  name={item === 'todo' ? NAV_ICONS.lists : NAV_ICONS.bucket}
                  size={16}
                  color={active ? '#4F46E5' : '#64748B'}
                />
                <Text className={`text-2xs font-extrabold ${active ? 'text-primary-600' : 'text-text-secondary'}`}>
                  {item === 'todo' ? 'To-Do Task' : 'Bucket Goal'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Input Add Card ───────────────────────────────────────── */}
        <Card className="p-4 mb-5 border border-indigo-50/40 bg-white">
          <Input
            placeholder={tab === 'todo' ? 'Add a shared task...' : 'Add a couple goal...'}
            value={title}
            onChangeText={setTitle}
            className="mb-1"
          />
          <Button title="Add to List" onPress={addItem} loading={createItem.isPending} />
        </Card>

        {/* ── Bucket Starters ──────────────────────────────────────── */}
        {tab === 'bucket' ? (
          <View className="mb-5">
            <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2.5">Inspiration Starters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {BUCKET_LIST_STARTERS.map((starter) => (
                <TouchableOpacity
                  key={starter}
                  onPress={() => addStarter(starter)}
                  className="bg-violet-50/60 border border-violet-100/50 rounded-xl px-3 py-2 mr-2 max-w-[220px] active:bg-violet-100"
                >
                  <Text className="text-2xs text-text-secondary font-medium">{starter}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ── List Items ───────────────────────────────────────────── */}
        {items.length === 0 ? (
          <Card className="p-6 items-center border border-indigo-50/60 bg-white">
            <AppIcon name={tab === 'bucket' ? NAV_ICONS.bucket : NAV_ICONS.lists} size={28} color="#94A3B8" />
            <Text className="text-2xs text-text-secondary mt-3 text-center font-medium">No items yet — create your first item above.</Text>
          </Card>
        ) : (
          items.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => onToggle(item)} activeOpacity={0.85}>
              <Card className={`p-4 mb-3 border ${item.completed ? 'bg-indigo-50/30 border-indigo-150' : 'bg-white border-indigo-50/40'}`}>
                <View className="flex-row items-center gap-3.5">
                  <View
                    className={`w-6 h-6 rounded-full border items-center justify-center ${
                      item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.completed ? <AppIcon name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-bold leading-normal ${item.completed ? 'text-indigo-700/80 line-through' : 'text-text-primary'}`}>
                      {item.title}
                    </Text>
                    <Text className="text-3xs text-text-secondary mt-0.5 font-semibold">
                      {item.completed ? 'Completed — tap to reopen' : 'Tap to mark complete'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
