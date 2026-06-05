import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenShell } from '../../components/ScreenShell';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { AppIcon } from '../../components/AppIcon';
import { BottomNav } from '../../components/BottomNav';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import {
  useWatchlist,
  useCreateWatchlistItem,
  useToggleWatchlistItem,
  useDeleteWatchlistItem,
  type WatchlistItem,
} from '../../lib/queries/watchlist';
import { useTheme } from '../../lib/hooks/useTheme';

type CategoryFilter = 'all' | 'show' | 'movie' | 'anime' | 'other';

export default function WatchlistScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  // Retrieve profiles & watchlist data
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';
  const isPaired = !!coupleId;

  const { data: items = [], isLoading: itemsLoading } = useWatchlist(coupleId);
  const createItem = useCreateWatchlistItem();
  const toggleItem = useToggleWatchlistItem();
  const deleteItem = useDeleteWatchlistItem();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'show' | 'movie' | 'anime' | 'other'>('show');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Tab filter state
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');

  const isLoading = profileLoading || itemsLoading;

  const handleAddItem = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for the recommendation.');
      return;
    }

    if (!coupleId || !user?.id) {
      Alert.alert('Pairing Required', 'Connect with your partner in settings first.');
      return;
    }

    // Basic URL validation if link is provided
    let cleanedLink = link.trim();
    if (cleanedLink && !/^https?:\/\//i.test(cleanedLink)) {
      cleanedLink = 'https://' + cleanedLink;
    }

    try {
      await createItem.mutateAsync({
        coupleId,
        userId: user.id,
        title: title.trim(),
        category,
        note: note.trim() || undefined,
        link: cleanedLink || undefined,
      });

      // Reset form & close
      setTitle('');
      setNote('');
      setLink('');
      setShowAddForm(false);
      Alert.alert('Added', 'Added to your shared watchlist!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add to watchlist.');
    }
  };

  const handleToggleWatched = async (item: WatchlistItem) => {
    try {
      await toggleItem.mutateAsync({
        itemId: item.id,
        coupleId: item.couple_id,
        isWatched: !item.is_watched,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update status.');
    }
  };

  const handleDeleteItem = (item: WatchlistItem) => {
    Alert.alert(
      'Delete Recommendation',
      `Are you sure you want to remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem.mutateAsync({
                itemId: item.id,
                coupleId: item.couple_id,
              });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete item.');
            }
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Invalid Link', 'Could not open the pasted URL.');
    });
  };

  // Filter items based on active tab
  const filteredItems = items.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  const pendingItems = filteredItems.filter((i) => !i.is_watched);
  const watchedItems = filteredItems.filter((i) => i.is_watched);

  const categoryLabels: Record<string, string> = {
    show: '📺 Show',
    movie: '🎬 Movie',
    anime: '🌸 Anime',
    other: '✨ Other',
  };

  const TABS: { label: string; value: CategoryFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Shows', value: 'show' },
    { label: 'Movies', value: 'movie' },
    { label: 'Anime', value: 'anime' },
    { label: 'Other', value: 'other' },
  ];

  if (isLoading) {
    return (
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <Skeleton width={100} height={20} className="mt-2.5 mb-2 py-1" />
            <View className="mb-4">
              <Skeleton width={200} height={28} className="mb-2" />
              <Skeleton width={140} height={16} />
            </View>
            <View className="flex-row gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={60} height={32} className="rounded-full" />
              ))}
            </View>
            <View className="gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width="100%" height={80} className="rounded-2xl" />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-1 px-4">
            {/* ── Standardized Header ── */}
            <View className="flex-row items-center justify-between pt-2.5 mb-5">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-indigo-50/60 items-center justify-center rounded-full active:opacity-75"
              >
                <AppIcon name="arrow-back" size={20} color="#4F46E5" />
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                <AppIcon name={NAV_ICONS.watchlist} size={22} color="#4F46E5" />
                <Text className="text-lg font-extrabold text-text-primary">Watchlist</Text>
              </View>
              <View className="w-10" />
            </View>

            {!isPaired ? (
              /* Unpaired empty state */
              <View className="flex-1 justify-center items-center px-6 pb-20">
                <Text className="text-5xl mb-4">🍿</Text>
                <Text className="text-xl font-bold text-text-primary mb-2 text-center" style={{ color: theme.textPrimary }}>
                  Shared Watchlist
                </Text>
                <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4" style={{ color: theme.textSecondary }}>
                  Pair with your partner to share movie, anime, and TV show recommendations with each other!
                </Text>
                <Button
                  title="Go to Settings"
                  onPress={() => router.push('/settings')}
                  className="w-full"
                />
              </View>
            ) : (
              <>
                {/* ── Tabs Filter Row ── */}
                <View className="mb-4">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                  >
                    {TABS.map((tab) => {
                      const isSelected = activeTab === tab.value;
                      return (
                        <TouchableOpacity
                          key={tab.value}
                          onPress={() => setActiveTab(tab.value)}
                          className="px-4 py-2 rounded-full border"
                          style={{
                            borderColor: isSelected ? theme.accent : 'rgba(229, 231, 235, 0.5)',
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(79, 70, 229, 0.08)'
                              : isDark
                                ? 'rgba(255, 255, 255, 0.02)'
                                : 'rgba(255, 255, 255, 0.6)',
                          }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{
                              color: isSelected
                                ? theme.accent
                                : isDark
                                  ? 'rgba(255, 255, 255, 0.6)'
                                  : theme.textSecondary,
                            }}
                          >
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* ── Main Scroll View for List ── */}
                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{ paddingBottom: 120 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Add recommendations toggle card */}
                  {showAddForm ? (
                    <Card glass className="p-5 mb-5 border border-indigo-150 gap-4 shadow-sm">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-base font-bold text-text-primary">Add Recommendation</Text>
                        <TouchableOpacity
                          onPress={() => setShowAddForm(false)}
                          className="bg-indigo-50/60 w-7 h-7 rounded-full items-center justify-center"
                        >
                          <AppIcon name="close" size={14} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>

                      <Input
                        label="Title / Show Name"
                        placeholder="e.g. Stranger Things, Inception..."
                        value={title}
                        onChangeText={setTitle}
                      />

                      {/* Category selector pills */}
                      <View>
                        <Text className="text-3xs font-bold text-text-secondary uppercase mb-2">Category</Text>
                        <View className="flex-row gap-2 flex-wrap">
                          {(['show', 'movie', 'anime', 'other'] as const).map((cat) => {
                            const isSelected = category === cat;
                            return (
                              <TouchableOpacity
                                key={cat}
                                onPress={() => setCategory(cat)}
                                className="px-3 py-1.5 rounded-xl border flex-1 items-center justify-center"
                                style={{
                                  borderColor: isSelected ? theme.accent : 'rgba(229, 231, 235, 0.5)',
                                  backgroundColor: isSelected
                                    ? isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(79, 70, 229, 0.05)'
                                    : isDark
                                      ? 'rgba(255, 255, 255, 0.02)'
                                      : 'rgba(255, 255, 255, 0.4)',
                                }}
                              >
                                <Text
                                  className="text-xs font-bold"
                                  style={{ color: isSelected ? theme.accent : theme.textSecondary }}
                                >
                                  {categoryLabels[cat]}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      <Input
                        label="Note (Why should we watch?)"
                        placeholder="e.g. Recommended by my friend, super cozy mood..."
                        value={note}
                        onChangeText={setNote}
                      />

                      <Input
                        label="Pasted Link (Netflix, IMDb, Youtube...)"
                        placeholder="e.g. netflix.com/title/..."
                        value={link}
                        onChangeText={setLink}
                        autoCapitalize="none"
                        keyboardType="url"
                      />

                      <Button
                        title="Add Recommendation"
                        onPress={handleAddItem}
                        disabled={!title.trim() || createItem.isPending}
                        loading={createItem.isPending}
                        className="w-full mt-2"
                      />
                    </Card>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowAddForm(true)}
                      className="py-3 px-4 border border-dashed border-indigo-200 bg-indigo-50/10 rounded-2xl flex-row items-center justify-center gap-2 mb-5 active:bg-indigo-50/20"
                    >
                      <AppIcon name="add" size={18} color="#4F46E5" />
                      <Text className="text-xs font-extrabold text-indigo-600">Suggest a Show or Movie</Text>
                    </TouchableOpacity>
                  )}

                  {/* ── Watchlist Group ───────────────────────────────── */}
                  {items.length === 0 ? (
                    <View className="py-12 items-center">
                      <Text className="text-4xl mb-3">🎬</Text>
                      <Text className="text-sm font-bold text-text-secondary">Watchlist is currently empty.</Text>
                      <Text className="text-3xs text-text-muted mt-1">Suggest something to watch together!</Text>
                    </View>
                  ) : (
                    <>
                      {/* Active / Pending Section */}
                      {pendingItems.length > 0 && (
                        <View className="mb-6">
                          <Text className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">
                            To Watch ({pendingItems.length})
                          </Text>
                          {pendingItems.map((item) => (
                            <Card
                              key={item.id}
                              className="p-4 mb-3 border border-indigo-50/30 flex-row items-center gap-3 bg-white"
                            >
                              {/* Checkbox button */}
                              <TouchableOpacity
                                onPress={() => handleToggleWatched(item)}
                                className="w-6 h-6 rounded-full border-2 border-indigo-200 items-center justify-center active:bg-indigo-50"
                              >
                                {item.is_watched && (
                                  <View className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
                                )}
                              </TouchableOpacity>

                              {/* Text content details */}
                              <View className="flex-1">
                                <View className="flex-row items-center gap-2 flex-wrap">
                                  <Text className="text-sm font-bold text-text-primary capitalize">{item.title}</Text>
                                  <View className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                                    <Text className="text-[9px] font-bold text-indigo-600">
                                      {categoryLabels[item.category] || item.category}
                                    </Text>
                                  </View>
                                </View>
                                {item.note ? (
                                  <Text className="text-xs text-text-secondary mt-1 font-medium italic">
                                    "{item.note}"
                                  </Text>
                                ) : null}
                              </View>

                              {/* Right Actions */}
                              <View className="flex-row items-center gap-2.5">
                                {item.link ? (
                                  <TouchableOpacity
                                    onPress={() => handleOpenLink(item.link)}
                                    className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center active:bg-indigo-100"
                                    accessibilityLabel="Open external link"
                                  >
                                    <AppIcon name="link" size={16} color="#4F46E5" />
                                  </TouchableOpacity>
                                ) : null}
                                <TouchableOpacity
                                  onPress={() => handleDeleteItem(item)}
                                  className="w-8 h-8 rounded-full bg-red-50 items-center justify-center active:bg-red-100"
                                  accessibilityLabel="Delete item"
                                >
                                  <AppIcon name="trash" size={16} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </Card>
                          ))}
                        </View>
                      )}

                      {/* Completed / Watched Section */}
                      {watchedItems.length > 0 && (
                        <View className="opacity-60">
                          <Text className="text-3xs font-extrabold text-slate-405 text-slate-400 uppercase tracking-widest mb-3 px-1">
                            Watched ({watchedItems.length})
                          </Text>
                          {watchedItems.map((item) => (
                            <Card
                              key={item.id}
                              className="p-4 mb-3 border border-slate-100 flex-row items-center gap-3 bg-slate-50"
                            >
                              {/* Checkbox button */}
                              <TouchableOpacity
                                onPress={() => handleToggleWatched(item)}
                                className="w-6 h-6 rounded-full border-2 border-indigo-600 items-center justify-center active:bg-indigo-50"
                              >
                                <View className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
                              </TouchableOpacity>

                              {/* Text content details */}
                              <View className="flex-1">
                                <View className="flex-row items-center gap-2 flex-wrap">
                                  <Text className="text-sm font-bold text-text-primary capitalize line-through text-slate-500">
                                    {item.title}
                                  </Text>
                                  <View className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                                    <Text className="text-[9px] font-bold text-slate-500">
                                      {categoryLabels[item.category] || item.category}
                                    </Text>
                                  </View>
                                </View>
                                {item.note ? (
                                  <Text className="text-xs text-slate-400 mt-1 font-medium italic line-through">
                                    "{item.note}"
                                  </Text>
                                ) : null}
                              </View>

                              {/* Right Actions */}
                              <View className="flex-row items-center gap-2.5">
                                {item.link ? (
                                  <TouchableOpacity
                                    onPress={() => handleOpenLink(item.link)}
                                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
                                    accessibilityLabel="Open external link"
                                  >
                                    <AppIcon name="link" size={16} color="#64748B" />
                                  </TouchableOpacity>
                                ) : null}
                                <TouchableOpacity
                                  onPress={() => handleDeleteItem(item)}
                                  className="w-8 h-8 rounded-full bg-red-50/50 items-center justify-center active:bg-red-100/55"
                                  accessibilityLabel="Delete item"
                                >
                                  <AppIcon name="trash" size={16} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </Card>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </View>
          <BottomNav />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}
