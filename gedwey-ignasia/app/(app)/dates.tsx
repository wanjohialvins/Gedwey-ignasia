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
    <ScreenShell className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-5 flex-row items-center gap-1">
          <AppIcon name="arrow-back" size={16} color={theme.accent} />
          <Text className="text-sm font-bold" style={{ color: theme.accent }}>Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 mb-2">
          <AppIcon name={NAV_ICONS.milestone} size={24} color={theme.accent} />
          <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>Important Dates</Text>
        </View>
        <Text className="text-sm mb-5" style={{ color: theme.textSecondary }}>
          Anniversaries, birthdays, and milestones — shared and visible to both partners.
        </Text>

        <Card className="p-5 mb-5">
          <Input label="Title" placeholder="e.g. First date anniversary" value={title} onChangeText={setTitle} />
          <Input label="Date (YYYY-MM-DD)" placeholder="2024-06-15" value={eventDate} onChangeText={setEventDate} autoCapitalize="none" />
          <Input label="Notes (optional)" placeholder="How you celebrate..." value={notes} onChangeText={setNotes} />
          <Button title="Add date" onPress={addDate} loading={createDate.isPending} />
        </Card>

        {sorted.length === 0 ? (
          <Card className="p-5">
            <Text className="text-sm" style={{ color: theme.textSecondary }}>No dates yet. Add your first anniversary or milestone above.</Text>
          </Card>
        ) : (
          sorted.map((d) => {
            const days = daysUntilDate(d.event_date, d.repeats_yearly);
            const addedBy =
              d.created_by === user?.id
                ? 'You'
                : d.profiles?.display_name || partnerProfile?.display_name || 'Partner';
            return (
              <Card key={d.id} className="p-4 mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{d.title}</Text>
                    <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                      {formatMonthDay(d.event_date + 'T00:00:00', 'long')}
                      {d.repeats_yearly ? ' (yearly)' : ''}
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: theme.textTertiary }}>
                      Added by {addedBy}
                      {days >= 0 ? ` · ${days === 0 ? 'Today!' : `In ${days} days`}` : ''}
                    </Text>
                    {d.notes ? (
                      <Text className="text-xs mt-2 italic" style={{ color: theme.textSecondary }}>{d.notes}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
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
                    <AppIcon name="trash-outline" size={18} color="#EF4444" />
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
