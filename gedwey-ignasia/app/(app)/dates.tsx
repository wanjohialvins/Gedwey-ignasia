import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import {
  daysUntilDate,
  useCreateImportantDate,
  useDeleteImportantDate,
  useImportantDates,
} from '../../lib/queries/coupleFeatures';
import { useTheme } from '../../lib/hooks/useTheme';
import { formatMonthDay } from '../../lib/dateUtils';

export default function ImportantDatesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile } = useUserProfile(profile?.partner_id ?? '');
  const { data: dates = [] } = useImportantDates(profile?.couple_id ?? '');
  const createDate = useCreateImportantDate();
  const deleteDate = useDeleteImportantDate();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');

  const sorted = useMemo(
    () =>
      [...dates].sort((a, b) => {
        const da = daysUntilDate(a.event_date, a.repeats_yearly);
        const db = daysUntilDate(b.event_date, b.repeats_yearly);
        return da - db;
      }),
    [dates]
  );

  const addDate = async () => {
    if (!profile?.couple_id || !user?.id) {
      Alert.alert('Pair first', 'Connect with your partner to share important dates.');
      return;
    }
    if (!title.trim() || !eventDate.trim()) {
      Alert.alert('Missing info', 'Enter a title and date (YYYY-MM-DD).');
      return;
    }
    try {
      await createDate.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        title: title.trim(),
        eventDate: eventDate.trim(),
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setEventDate('');
      setNotes('');
      Alert.alert('Saved', 'Date added for both of you.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save.');
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
            <AppIcon name={NAV_ICONS.milestone} size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Important Dates</Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="text-xs text-text-secondary leading-relaxed mb-5 px-1">
          Anniversaries, birthdays, and milestones — shared and visible to both partners.
        </Text>

        {/* ── Add New Date Form Card ────────────────────────────────── */}
        <Card className="p-4 mb-5 border border-indigo-50/40 bg-white">
          <Input label="Title" placeholder="e.g. First date anniversary" value={title} onChangeText={setTitle} />
          <Input label="Date (YYYY-MM-DD)" placeholder="2024-06-15" value={eventDate} onChangeText={setEventDate} autoCapitalize="none" />
          <Input label="Notes (optional)" placeholder="How you celebrate..." value={notes} onChangeText={setNotes} className="mb-2" />
          <Button title="Save Shared Date" onPress={addDate} loading={createDate.isPending} />
        </Card>

        {/* ── Date Listing Timeline ─────────────────────────────────── */}
        <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">Our Anniversaries & Milestones</Text>

        {sorted.length === 0 ? (
          <Card className="p-5 border border-indigo-50/60 bg-white">
            <Text className="text-2xs text-text-secondary text-center font-semibold leading-relaxed">
              No dates yet. Add your first anniversary or milestone above.
            </Text>
          </Card>
        ) : (
          sorted.map((d) => {
            const days = daysUntilDate(d.event_date, d.repeats_yearly);
            const addedBy =
              d.created_by === user?.id
                ? 'You'
                : d.profiles?.display_name || partnerProfile?.display_name || 'Partner';
            return (
              <Card key={d.id} className="p-4 mb-3.5 border border-indigo-50/40 bg-white">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-text-primary">{d.title}</Text>
                    
                    <Text className="text-2xs text-indigo-600 font-extrabold mt-1">
                      {formatMonthDay(d.event_date + 'T00:00:00', 'long')}
                      {d.repeats_yearly ? ' (yearly)' : ''}
                    </Text>
                    
                    <Text className="text-3xs text-text-secondary mt-1.5 font-semibold">
                      Added by {addedBy}
                      {days >= 0 ? ` · ${days === 0 ? 'Today! 🎉' : `In ${days} days ⏳`}` : ''}
                    </Text>
                    
                    {d.notes ? (
                      <View className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                        <Text className="text-3xs text-text-secondary italic leading-relaxed">"{d.notes}"</Text>
                      </View>
                    ) : null}
                  </View>
                  
                  <TouchableOpacity
                    className="w-8 h-8 rounded-lg bg-red-50/80 items-center justify-center border border-red-100 active:bg-red-100"
                    onPress={() =>
                      Alert.alert('Remove date?', d.title, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () =>
                            deleteDate.mutateAsync({ id: d.id, coupleId: profile!.couple_id! }),
                        },
                      ])
                    }
                  >
                    <AppIcon name="trash-outline" size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
