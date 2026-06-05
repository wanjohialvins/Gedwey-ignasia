import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from '../../lib/queries/coupleFeatures';
import { useTheme } from '../../lib/hooks/useTheme';
import { askCycleAssistant } from '../../lib/queries/cycleAssistant';
import { scheduleLocalNotification } from '../../lib/notifications';
import { formatMonthDay, formatMonthYear, formatWeekdayMonthDay } from '../../lib/dateUtils';
import type { IconName } from '../../lib/navigationIcons';
import type { CycleLog } from '../../lib/queries/coupleFeatures';
import {
  buildCycleDayMap,
  findPatterns,
  generateInsights,
  generateReminders,
  getCyclePrediction,
  moodTrend,
  parseSymptoms,
  parseVoiceInput,
  respondToCycleQuery,
  serializeSymptoms,
} from '../../lib/cycleIntelligence';

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
const MOOD_OPTIONS = [
  { key: 'great', icon: 'sunny-outline', color: '#F59E0B', label: 'Great' },
  { key: 'okay', icon: 'ellipse-outline', color: '#64748B', label: 'Okay' },
  { key: 'tired', icon: 'moon-outline', color: '#6366F1', label: 'Tired' },
  { key: 'crampy', icon: 'pulse-outline', color: '#E11D48', label: 'Crampy' },
  { key: 'emotional', icon: 'water-outline', color: '#0EA5E9', label: 'Emotional' },
  { key: 'energetic', icon: 'flash-outline', color: '#10B981', label: 'Energetic' },
] satisfies { key: string; icon: IconName; color: string; label: string }[];
const SYMPTOM_OPTIONS = ['cramps', 'headache', 'bloating', 'nausea', 'back pain', 'breast tenderness'];
const STRESS_OPTIONS = ['low', 'medium', 'high'] as const;
const PRIVACY_OPTIONS = ['cloud', 'local'] as const;
const CYCLE_PRIVACY_KEY = 'cycle-tracker:privacy-mode';

const formatDate = (iso: string) =>
  formatMonthDay(iso + 'T00:00:00', 'short');

const localCycleKey = (userId?: string) => `cycle-tracker:local-logs:${userId ?? 'anonymous'}`;

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

function InfoTile({
  icon,
  label,
  value,
  color,
  backgroundColor,
  valueColor,
}: {
  icon: IconName;
  label: string;
  value: string;
  color: string;
  backgroundColor: string;
  valueColor: string;
}) {
  return (
    <View className="flex-1 min-w-[130px] p-3 rounded-lg" style={{ backgroundColor }}>
      <View className="flex-row items-center gap-2 mb-2">
        <AppIcon name={icon} size={16} color={color} />
        <Text className="text-[10px] font-bold uppercase" style={{ color }}>
          {label}
        </Text>
      </View>
      <Text className="text-sm font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}

export default function CycleCalendarScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: remoteLogs = [] } = useCycleLogs(profile?.couple_id ?? '');
  const upsertLog = useUpsertCycleLog();
  const { theme } = useTheme();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [flowStrength, setFlowStrength] = useState<FlowStrength>('none');
  const [mood, setMood] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [stressLevel, setStressLevel] = useState<(typeof STRESS_OPTIONS)[number]>('medium');
  const [sleepHours, setSleepHours] = useState('7');
  const [voiceText, setVoiceText] = useState('');
  const [assistantQuery, setAssistantQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your cycle assistant. Ask me anything about symptoms, predictions, or mood trends!',
    },
  ]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<(typeof PRIVACY_OPTIONS)[number]>('cloud');
  const [localLogs, setLocalLogs] = useState<CycleLog[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CYCLE_PRIVACY_KEY)
      .then((saved) => {
        if (saved === 'cloud' || saved === 'local') setPrivacyMode(saved);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(localCycleKey(user?.id))
      .then((saved) => {
        if (saved) setLocalLogs(JSON.parse(saved) as CycleLog[]);
      })
      .catch(() => {});
  }, [user?.id]);

  const setMode = async (mode: (typeof PRIVACY_OPTIONS)[number]) => {
    setPrivacyMode(mode);
    await AsyncStorage.setItem(CYCLE_PRIVACY_KEY, mode);
  };

  const logs = privacyMode === 'local' ? localLogs : remoteLogs;

  const logMap = useMemo(() => {
    const m = new Map<string, (typeof logs)[0]>();
    logs.forEach((l) => m.set(l.log_date, l));
    return m;
  }, [logs]);

  const prediction = useMemo(
    () =>
      getCyclePrediction(logs, {
        stressLevel,
        sleepHours: Number.isFinite(Number(sleepHours)) ? Number(sleepHours) : undefined,
      }),
    [logs, sleepHours, stressLevel]
  );
  const predictionDate = prediction?.nextPeriod ?? null;
  const symptomLogs = useMemo(
    () =>
      logs
        .map((log) => ({
          date: log.log_date,
          symptoms: parseSymptoms(log.symptoms),
          mood: log.mood ?? '',
        }))
        .filter((log) => log.symptoms.length || log.mood),
    [logs]
  );
  const insights = useMemo(() => {
    const cycleDayMap = buildCycleDayMap(logs);
    return generateInsights(findPatterns(symptomLogs, cycleDayMap));
  }, [logs, symptomLogs]);
  const reminders = useMemo(() => generateReminders(prediction), [prediction]);
  const recentMoodTrend = useMemo(() => moodTrend(symptomLogs).slice(0, 5), [symptomLogs]);
  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  const selectedLog = logMap.get(selectedDate);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]
    );
  };

  const applyVoiceText = () => {
    const parsed = parseVoiceInput(voiceText);
    if (parsed.symptoms.length) {
      setSymptoms((current) => Array.from(new Set([...current, ...parsed.symptoms])));
    }
    if (parsed.mood) setMood(parsed.mood);
    if (!parsed.symptoms.length && !parsed.mood) {
      Alert.alert('No match yet', 'Try mentioning cramps, headache, bloating, tired, emotional, or great.');
    }
  };

  const askAssistant = async () => {
    const query = assistantQuery.trim();
    if (!query) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'user' as const, content: query };
    setChatMessages((prev) => [...prev, userMsg]);
    setAssistantQuery('');
    setAssistantLoading(true);

    try {
      const answer = await askCycleAssistant(query, {
        ...(prediction ?? {}),
        insights,
        reminders,
        symptoms,
        mood,
      });
      const assistantMsg = { id: `assistant-${Date.now()}`, role: 'assistant' as const, content: answer };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('[CycleAssistant] OpenAI/Edge function failed, falling back to local responder:', err?.message || err);
      const fallbackAnswer = respondToCycleQuery(query, {
        phase: prediction?.phase,
        insights,
      });
      const assistantMsg = { id: `assistant-${Date.now()}`, role: 'assistant' as const, content: fallbackAnswer };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const scheduleSmartReminders = async () => {
    if (!prediction) {
      Alert.alert('More data needed', 'Log at least 2 period starts before scheduling smart reminders.');
      return;
    }

    const scheduled: string[] = [];
    const periodReminderDays = Math.max(0, prediction.daysToPeriod - 2);
    const periodId = await scheduleLocalNotification(
      'Cycle reminder',
      'Your period is likely in 2 days.',
      Math.max(60, periodReminderDays * 86400),
      { identifier: 'cycle-period-reminder', data: { type: 'cycle_period' } }
    );
    if (periodId) scheduled.push('period');

    if (prediction.phase === 'luteal' || prediction.phase === 'pms') {
      const energyId = await scheduleLocalNotification(
        'Cycle check-in',
        'You may feel lower energy today. Be gentle with your plans.',
        60,
        { identifier: 'cycle-energy-reminder', data: { type: 'cycle_energy' } }
      );
      if (energyId) scheduled.push('energy');
    }

    if (prediction.phase === 'fertile' || prediction.phase === 'ovulation') {
      const fertilityId = await scheduleLocalNotification(
        'Fertility window',
        'Your fertility window is active based on recent cycle logs.',
        60,
        { identifier: 'cycle-fertility-reminder', data: { type: 'cycle_fertility' } }
      );
      if (fertilityId) scheduled.push('fertility');
    }

    Alert.alert(
      scheduled.length ? 'Reminders scheduled' : 'Could not schedule',
      scheduled.length
        ? `Scheduled ${scheduled.join(', ')} reminder${scheduled.length > 1 ? 's' : ''}.`
        : 'Notification permissions may be disabled on this device.'
    );
  };

  const saveLog = async () => {
    if (privacyMode === 'local') {
      const nextLog: CycleLog = {
        id: `local-${selectedDate}`,
        couple_id: 'local',
        user_id: user?.id ?? 'local',
        log_date: selectedDate,
        flow_strength: flowStrength,
        mood: mood || null,
        symptoms: serializeSymptoms(symptoms) ?? null,
        notes: notes.trim() || null,
        predicted_next: prediction?.nextPeriod ?? null,
      };
      const nextLogs = [nextLog, ...localLogs.filter((log) => log.log_date !== selectedDate)].sort(
        (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
      );
      setLocalLogs(nextLogs);
      await AsyncStorage.setItem(localCycleKey(user?.id), JSON.stringify(nextLogs));
      Alert.alert('Saved locally', 'This cycle entry stays on this device.');
      return;
    }

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
        symptoms: serializeSymptoms(symptoms),
        notes: notes.trim() || undefined,
        predictedNext: prediction?.nextPeriod,
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

  const monthLabel = formatMonthYear(new Date(viewYear, viewMonth));

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        {/* ── Standardized Header ── */}
        <View className="flex-row items-center justify-between pt-2.5 mb-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-indigo-50/60 items-center justify-center rounded-full active:opacity-75"
          >
            <AppIcon name="arrow-back" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name={NAV_ICONS.cycle} size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Cycle Calendar</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 112 }} showsVerticalScrollIndicator={false}>
          <Text className="text-sm mb-4" style={{ color: theme.textSecondary }}>
            Track flow, mood, and symptoms — shared with your partner. Smart predictions improve as you log more.
          </Text>

        <Card className="p-5 mb-4" style={{ backgroundColor: prediction ? '#FFF1F2' : theme.cardBackground, borderColor: '#FECDD3' }}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase" style={{ color: prediction ? '#BE123C' : theme.textTertiary }}>
                Smart cycle tracker
              </Text>
              <Text className="text-2xl font-bold mt-1" style={{ color: prediction ? '#881337' : theme.textPrimary }}>
                {prediction ? `${Math.max(0, prediction.daysToPeriod)} days` : 'Ready when you log'}
              </Text>
              <Text className="text-sm mt-1" style={{ color: prediction ? '#9F1239' : theme.textSecondary }}>
                {prediction
                  ? `Next period: ${formatWeekdayMonthDay(prediction.nextPeriod + 'T00:00:00', 'long')}`
                  : 'Log at least 2 period starts to unlock predictions.'}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#FFE4E6' }}>
              <AppIcon name="sparkles-outline" size={24} color="#BE123C" />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-4">
            <View className="px-3 py-2 rounded-full" style={{ backgroundColor: '#FFFFFF' }}>
              <Text className="text-xs font-bold capitalize" style={{ color: '#BE123C' }}>
                {prediction ? prediction.phase : 'learning'}
              </Text>
            </View>
            <View className="px-3 py-2 rounded-full" style={{ backgroundColor: '#FFFFFF' }}>
              <Text className="text-xs font-bold" style={{ color: '#BE123C' }}>
                {prediction ? `${prediction.regularityScore}/100 regularity` : `${logs.length} logs`}
              </Text>
            </View>
            <View className="px-3 py-2 rounded-full" style={{ backgroundColor: '#FFFFFF' }}>
              <Text className="text-xs font-bold" style={{ color: '#BE123C' }}>
                {privacyMode === 'local' ? 'local only' : 'shared cloud'}
              </Text>
            </View>
          </View>
        </Card>

        {prediction ? (
          <Card className="p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>Smart dashboard</Text>
              <TouchableOpacity onPress={scheduleSmartReminders} className="flex-row items-center gap-1">
                <AppIcon name="notifications-outline" size={15} color={theme.accent} />
                <Text className="text-xs font-bold" style={{ color: theme.accent }}>Schedule</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2 mb-3">
              <InfoTile icon="egg-outline" label="Ovulation" value={formatDate(prediction.ovulation)} color="#7C3AED" backgroundColor="#F3E8FF" valueColor="#581C87" />
              <InfoTile icon="leaf-outline" label="Fertile window" value={`${formatDate(prediction.fertileStart)} - ${formatDate(prediction.fertileEnd)}`} color="#059669" backgroundColor="#D1FAE5" valueColor="#064E3B" />
              <InfoTile icon="calendar-outline" label="PMS window" value={`${formatDate(prediction.pmsStart)} - ${formatDate(prediction.pmsEnd)}`} color="#D97706" backgroundColor="#FEF3C7" valueColor="#78350F" />
            </View>

            <Text className="text-xs font-bold mb-2" style={{ color: theme.textSecondary }}>Lifestyle adjustment</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {STRESS_OPTIONS.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setStressLevel(level)}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: stressLevel === level ? theme.accentLight : theme.surface,
                    borderColor: stressLevel === level ? theme.accent : theme.border,
                  }}
                >
                  <Text className="text-xs font-bold capitalize" style={{ color: theme.textSecondary }}>{level} stress</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              label="Sleep hours"
              keyboardType="numeric"
              value={sleepHours}
              onChangeText={setSleepHours}
              containerClassName="mb-1"
            />
          </Card>
        ) : null}

        <Card className="p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>Privacy storage</Text>
              <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                {privacyMode === 'local' ? 'Entries stay on this device.' : 'Entries sync with your partner.'}
              </Text>
            </View>
            <AppIcon name={privacyMode === 'local' ? 'lock-closed-outline' : 'cloud-outline'} size={22} color={theme.accent} />
          </View>
          <View className="flex-row gap-2">
            {PRIVACY_OPTIONS.map((mode) => {
              const selected = privacyMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setMode(mode)}
                  className="flex-1 h-11 rounded-lg border items-center justify-center"
                  style={{
                    backgroundColor: selected ? theme.accentLight : theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                  }}
                >
                  <Text className="text-xs font-bold capitalize" style={{ color: selected ? theme.accent : theme.textSecondary }}>
                    {mode === 'cloud' ? 'Shared cloud' : 'Local only'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

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
                      setSymptoms(parseSymptoms(log.symptoms));
                      setNotes(log.notes || '');
                    } else {
                      setFlowStrength('none');
                      setMood('');
                      setSymptoms([]);
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
                  {log?.mood ? (
                    <AppIcon
                      name={MOOD_OPTIONS.find((m) => m.key === log.mood)?.icon ?? 'ellipse-outline'}
                      size={9}
                      color={isSelected ? '#fff' : MOOD_OPTIONS.find((m) => m.key === log.mood)?.color ?? theme.textTertiary}
                    />
                  ) : null}
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
            Log for {formatMonthDay(selectedDate + 'T00:00:00', 'short')}
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
            {MOOD_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMood(m.key)}
                className="px-3 py-2 rounded-xl border items-center min-w-[76px]"
                style={{
                  backgroundColor: mood === m.key ? theme.accentLight : theme.surface,
                  borderColor: mood === m.key ? m.color : theme.border,
                }}
              >
                <AppIcon name={m.icon} size={18} color={mood === m.key ? m.color : theme.textTertiary} />
                <Text className="text-[10px] font-bold mt-1" style={{ color: mood === m.key ? m.color : theme.textSecondary }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs font-bold mb-2" style={{ color: theme.textSecondary }}>Symptoms</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SYMPTOM_OPTIONS.map((symptom) => {
              const selected = symptoms.includes(symptom);
              return (
                <TouchableOpacity
                  key={symptom}
                  onPress={() => toggleSymptom(symptom)}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: selected ? theme.accentLight : theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                  }}
                >
                  <Text className="text-xs font-bold capitalize" style={{ color: selected ? theme.accent : theme.textSecondary }}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Voice note text"
            placeholder="I feel tired with cramps"
            value={voiceText}
            onChangeText={setVoiceText}
            containerClassName="mb-2"
          />
          <Button title="Parse voice text" variant="secondary" onPress={applyVoiceText} className="mb-4" />

          <Input label="Notes" placeholder="Symptoms, energy level..." value={notes} onChangeText={setNotes} />
          <Button
            title={privacyMode === 'local' ? 'Save locally' : 'Sync entry'}
            onPress={saveLog}
            loading={privacyMode === 'cloud' && upsertLog.isPending}
          />
        </Card>

        <Card className="p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <AppIcon name="analytics-outline" size={18} color={theme.accent} />
            <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>Insights and reminders</Text>
          </View>
          {[...reminders, ...insights].length ? (
            [...reminders, ...insights].slice(0, 5).map((item) => (
              <View key={item} className="flex-row gap-2 mb-2">
                <AppIcon name="sparkles-outline" size={14} color={theme.accent} />
                <Text className="text-sm flex-1" style={{ color: theme.textSecondary }}>
                  {item}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Add symptoms across a few cycles to unlock pattern insights.
            </Text>
          )}
          {recentMoodTrend.length ? (
            <View className="mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
              <Text className="text-xs font-bold mb-2" style={{ color: theme.textTertiary }}>Recent mood trend</Text>
              {recentMoodTrend.map((item) => (
                <Text key={`${item.date}-${item.mood}`} className="text-xs mb-1" style={{ color: theme.textSecondary }}>
                  {formatDate(item.date)}: {item.mood || 'not logged'}
                </Text>
              ))}
            </View>
          ) : null}
        </Card>

        <Card className="p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <AppIcon name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
            <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>Cycle assistant</Text>
          </View>

          {/* Message Bubbles Container */}
          <View className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 min-h-[160px] max-h-[300px]">
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <View
                    key={msg.id}
                    className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-2 mt-1">
                        <Text className="text-[10px]">🤖</Text>
                      </View>
                    )}
                    <View
                      className={`p-3 max-w-[80%] rounded-2xl ${
                        isUser
                          ? 'bg-indigo-600 rounded-tr-none'
                          : 'bg-white border border-indigo-100 rounded-tl-none'
                      }`}
                      style={isUser ? { backgroundColor: theme.accent } : undefined}
                    >
                      <Text
                        className={`text-xs leading-relaxed ${
                          isUser ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {msg.content}
                      </Text>
                    </View>
                    {isUser && (
                      <View className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 items-center justify-center ml-2 mt-1">
                        <Text className="text-[10px]">👤</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {assistantLoading && (
                <View className="flex-row items-center mb-3 justify-start">
                  <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-2 mt-1">
                    <Text className="text-[10px]">🤖</Text>
                  </View>
                  <View className="p-3 bg-white border border-indigo-100 rounded-2xl rounded-tl-none">
                    <Text className="text-xs text-slate-400 italic">Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Chat input row */}
          <View className="flex-row items-center gap-2 mt-4">
            <Input
              placeholder="Ask a question..."
              value={assistantQuery}
              onChangeText={setAssistantQuery}
              containerClassName="mb-0 flex-1"
            />
            <TouchableOpacity
              onPress={askAssistant}
              disabled={assistantLoading || !assistantQuery.trim()}
              className="w-12 h-12 rounded-xl items-center justify-center active:opacity-75 disabled:opacity-50"
              style={{ backgroundColor: theme.accent }}
            >
              <AppIcon name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
            <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              {parseSymptoms(selectedLog.symptoms).length ? `Symptoms: ${parseSymptoms(selectedLog.symptoms).join(', ')}` : 'No symptoms logged'}
            </Text>
          </Card>
        ) : null}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}
