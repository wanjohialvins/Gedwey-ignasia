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
  useCycleLogs,
  useUpsertCycleLog,
  predictNextCycle,
} from '../../lib/queries/coupleFeatures';
import { useTheme } from '../../lib/hooks/useTheme';

const FLOW_OPTIONS = [
  { id: 'none', label: 'None', color: '#94A3B8', droplets: 0 },
  { id: 'spotting', label: 'Spotting', color: '#FECDD3', droplets: 1 },
  { id: 'light', label: 'Light', color: '#FB7185', droplets: 2 },
  { id: 'medium', label: 'Medium', color: '#E11D48', droplets: 3 },
  { id: 'heavy', label: 'Heavy', color: '#9F1239', droplets: 4 },
] as const;

type FlowStrength = (typeof FLOW_OPTIONS)[number]['id'];

const CYCLE_MOODS = [
  { key: 'great', emoji: '😊', label: 'Great' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'crampy', emoji: '😣', label: 'Crampy' },
  { key: 'emotional', emoji: '🥺', label: 'Emotional' },
  { key: 'energetic', emoji: '⚡', label: 'Energetic' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function FlowDroplets({ strength, size = 7 }: { strength?: string | null; size?: number }) {
  const flow = FLOW_OPTIONS.find((f) => f.id === strength);
  if (!flow || flow.droplets === 0) return null;

  return (
    <View className="flex-row justify-center gap-[2px] mt-0.5">
      {Array.from({ length: flow.droplets }).map((_, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size * 1.3,
            borderRadius: size / 2,
            borderTopLeftRadius: size * 0.15,
            borderTopRightRadius: size * 0.15,
            backgroundColor: flow.color,
            opacity: 0.7 + i * 0.08,
          }}
        />
      ))}
    </View>
  );
}

export default function CycleCalendarScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: logs = [] } = useCycleLogs(profile?.couple_id ?? '');
  const upsertLog = useUpsertCycleLog();
  const { theme } = useTheme();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [flowStrength, setFlowStrength] = useState<FlowStrength>('none');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');

  const logMap = useMemo(() => {
    const m = new Map<string, (typeof logs)[0]>();
    logs.forEach((l) => m.set(l.log_date, l));
    return m;
  }, [logs]);

  const predictionDate = useMemo(() => predictNextCycle(logs), [logs]);
  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  const selectedLog = logMap.get(selectedDate);

  const saveLog = async () => {
    if (!profile?.couple_id || !user?.id) {
      Alert.alert('Pair first', 'Connect with your partner to track cycles together.');
      return;
    }
    try {
      await upsertLog.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        logDate: selectedDate,
        flowStrength,
        mood: mood || undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Saved', 'Cycle entry updated — your partner can see it too.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save.');
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <ScreenShell className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-5 flex-row items-center gap-1">
          <AppIcon name="arrow-back" size={16} color={theme.accent} />
          <Text className="text-sm font-bold" style={{ color: theme.accent }}>Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 mb-2">
          <AppIcon name={NAV_ICONS.health} size={24} color={theme.accent} />
          <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>Cycle Calendar</Text>
        </View>
        <Text className="text-sm mb-4" style={{ color: theme.textSecondary }}>
          Track flow, mood, and symptoms — shared with your partner. Smart predictions improve as you log more.
        </Text>

        {predictionDate ? (
          <Card className="p-4 mb-4" style={{ backgroundColor: theme.accentLight, borderColor: theme.border }}>
            <Text className="text-sm font-bold" style={{ color: theme.accent }}>Predicted next period</Text>
            <Text className="text-base font-bold mt-1" style={{ color: theme.textPrimary }}>
              {new Date(predictionDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </Card>
        ) : (
          <Card className="p-4 mb-4">
            <Text className="text-xs" style={{ color: theme.textSecondary }}>
              Log at least 2 period starts to unlock smart predictions.
            </Text>
          </Card>
        )}

        <Card className="p-4 mb-5">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={prevMonth}>
              <AppIcon name="chevron-back" size={22} color={theme.accent} />
            </TouchableOpacity>
            <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth}>
              <AppIcon name="chevron-forward" size={22} color={theme.accent} />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-2">
            {WEEKDAYS.map((d) => (
              <Text key={d} className="flex-1 text-center text-[10px] font-bold" style={{ color: theme.textTertiary }}>
                {d}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarDays.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} className="w-[14.28%] aspect-square" />;
              const iso = day.toISOString().slice(0, 10);
              const log = logMap.get(iso);
              const flow = log?.flow_strength;
              const isSelected = iso === selectedDate;
              const isPredicted = predictionDate && iso === predictionDate;

              return (
                <TouchableOpacity
                  key={iso}
                  onPress={() => {
                    setSelectedDate(iso);
                    if (log) {
                      setFlowStrength((log.flow_strength as FlowStrength) || 'none');
                      setMood(log.mood || '');
                      setNotes(log.notes || '');
                    } else {
                      setFlowStrength('none');
                      setMood('');
                      setNotes('');
                    }
                  }}
                  className="w-[14.28%] aspect-square items-center justify-center rounded-xl m-[1px] py-0.5"
                  style={{
                    backgroundColor: isSelected ? theme.accent : 'transparent',
                    borderWidth: isPredicted ? 2 : 0,
                    borderColor: isPredicted ? theme.accent : 'transparent',
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: isSelected ? '#fff' : theme.textPrimary }}
                  >
                    {day.getDate()}
                  </Text>
                  {flow && flow !== 'none' ? (
                    <FlowDroplets strength={flow} size={6} />
                  ) : null}
                  {log?.mood ? <Text className="text-[8px]">{CYCLE_MOODS.find((m) => m.key === log.mood)?.emoji}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row flex-wrap gap-3 mt-4 pt-3 border-t" style={{ borderColor: theme.border }}>
            {FLOW_OPTIONS.filter((f) => f.id !== 'none').map((f) => (
              <View key={f.id} className="flex-row items-center gap-1">
                <FlowDroplets strength={f.id} size={8} />
                <Text className="text-[10px] font-bold" style={{ color: theme.textSecondary }}>{f.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card className="p-5 mb-5">
          <Text className="text-sm font-bold mb-3" style={{ color: theme.textPrimary }}>
            Log for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>

          <Text className="text-xs font-bold mb-2" style={{ color: theme.textSecondary }}>Flow strength</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {FLOW_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFlowStrength(f.id)}
                className="px-3 py-2 rounded-xl border items-center min-w-[72px]"
                style={{
                  backgroundColor: flowStrength === f.id ? f.color + '25' : theme.surface,
                  borderColor: flowStrength === f.id ? f.color : theme.border,
                }}
              >
                {f.droplets > 0 ? <FlowDroplets strength={f.id} size={9} /> : <Text className="text-[10px] text-slate-400">—</Text>}
                <Text className="text-xs font-bold mt-0.5" style={{ color: flowStrength === f.id ? f.color : theme.textSecondary }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs font-bold mb-2" style={{ color: theme.textSecondary }}>How are you feeling?</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CYCLE_MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMood(m.key)}
                className="px-3 py-2 rounded-xl border items-center"
                style={{
                  backgroundColor: mood === m.key ? theme.accentLight : theme.surface,
                  borderColor: mood === m.key ? theme.accent : theme.border,
                }}
              >
                <Text className="text-lg">{m.emoji}</Text>
                <Text className="text-[10px] font-bold" style={{ color: theme.textSecondary }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Notes" placeholder="Symptoms, energy level..." value={notes} onChangeText={setNotes} />
          <Button title="Save entry" onPress={saveLog} loading={upsertLog.isPending} />
        </Card>

        {selectedLog ? (
          <Card className="p-4">
            <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.textTertiary }}>Partner visibility</Text>
            <View className="flex-row items-center gap-2 mb-1">
              <FlowDroplets strength={selectedLog.flow_strength} size={10} />
              <Text className="text-sm capitalize" style={{ color: theme.textSecondary }}>
                Flow: {selectedLog.flow_strength || 'none'}
              </Text>
            </View>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              {selectedLog.mood ? `Mood: ${selectedLog.mood}` : 'No mood logged'}
            </Text>
          </Card>
        ) : null}
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
