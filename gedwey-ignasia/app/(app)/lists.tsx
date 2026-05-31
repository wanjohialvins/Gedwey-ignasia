import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
    <ScreenShell className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <View className="flex-row items-center gap-3 mb-2">
          <AppIcon name={tab === 'bucket' ? NAV_ICONS.bucket : NAV_ICONS.lists} size={26} color="#4F46E5" />
          <Text className="text-2xl font-bold text-text-primary">Shared Lists</Text>
        </View>
        <Text className="text-sm text-text-secondary mb-5">Track tasks and couple goals together.</Text>

        <View className="flex-row bg-white border border-indigo-100 rounded-2xl p-1 mb-5 shadow-sm">
          {(['todo', 'bucket'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setTab(item)}
              className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 ${tab === item ? 'bg-indigo-600' : ''}`}
            >
              <AppIcon
                name={item === 'todo' ? NAV_ICONS.lists : NAV_ICONS.bucket}
                size={18}
                color={tab === item ? '#fff' : '#64748B'}
              />
              <Text className={`text-sm font-bold ${tab === item ? 'text-white' : 'text-text-secondary'}`}>
                {item === 'todo' ? 'To-Do' : 'Bucket'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card className="p-4 mb-5 border-indigo-50">
          <Input
            placeholder={tab === 'todo' ? 'Add a shared task' : 'Add a couple goal'}
            value={title}
            onChangeText={setTitle}
          />
          <Button title="Add Item" onPress={addItem} loading={createItem.isPending} />
        </Card>

        {tab === 'bucket' ? (
          <View className="mb-5">
            <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Starter ideas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {BUCKET_LIST_STARTERS.map((starter) => (
                <TouchableOpacity
                  key={starter}
                  onPress={() => addStarter(starter)}
                  className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 mr-2 max-w-[220px]"
                >
                  <Text className="text-xs text-text-secondary">{starter}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {items.length === 0 ? (
          <Card className="p-5 items-center">
            <AppIcon name={tab === 'bucket' ? NAV_ICONS.bucket : NAV_ICONS.lists} size={32} color="#94A3B8" />
            <Text className="text-sm text-text-secondary mt-3 text-center">No items yet — add your first one above.</Text>
          </Card>
        ) : (
          items.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => onToggle(item)} activeOpacity={0.85}>
              <Card className={`p-4 mb-3 ${item.completed ? 'bg-indigo-50/80 border-indigo-100' : ''}`}>
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-8 h-8 rounded-full border items-center justify-center ${item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}
                  >
                    {item.completed ? <AppIcon name="checkmark-circle" size={16} color="#fff" /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-bold ${item.completed ? 'text-indigo-700' : 'text-text-primary'}`}>{item.title}</Text>
                    <Text className="text-xs text-text-secondary mt-1">
                      {item.completed ? 'Done — tap to reopen' : 'Tap to complete'}
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
