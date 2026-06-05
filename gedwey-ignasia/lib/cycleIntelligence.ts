import type { CycleLog } from './queries/coupleFeatures';

export type Cycle = {
  startDate: string;
  endDate?: string;
};

export type SymptomLog = {
  date: string;
  symptoms: string[];
  mood: string;
};

export type CycleLifestyleContext = {
  stressLevel?: 'low' | 'medium' | 'high';
  sleepHours?: number;
};

export type CyclePrediction = {
  averageLength: number;
  nextPeriod: string;
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
  pmsStart: string;
  pmsEnd: string;
  phase: CyclePhase;
  daysToPeriod: number;
  regularityScore: number;
  cycleLengths: number[];
};

export type CyclePhase = 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'pms';

const DAY_MS = 86400000;
const PERIOD_FLOW = new Set(['spotting', 'light', 'medium', 'heavy']);

const toDate = (iso: string) => new Date(`${iso}T00:00:00`);

const toIso = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (iso: string, days: number) => {
  const date = toDate(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
};

const daysBetween = (fromIso: string, toIsoDate: string) =>
  Math.round((toDate(toIsoDate).getTime() - toDate(fromIso).getTime()) / DAY_MS);

export function parseSymptoms(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeSymptoms(symptoms: string[]): string | undefined {
  const unique = Array.from(new Set(symptoms.map((s) => s.trim()).filter(Boolean)));
  return unique.length ? unique.join(', ') : undefined;
}

export function getPeriodCycles(logs: CycleLog[]): Cycle[] {
  const flowLogs = [...logs]
    .filter((log) => log.flow_strength && PERIOD_FLOW.has(log.flow_strength))
    .sort((a, b) => toDate(a.log_date).getTime() - toDate(b.log_date).getTime());

  const cycles: Cycle[] = [];
  let active: Cycle | null = null;
  let previousDate: string | null = null;

  flowLogs.forEach((log) => {
    if (!active || !previousDate || daysBetween(previousDate, log.log_date) > 1) {
      active = { startDate: log.log_date, endDate: log.log_date };
      cycles.push(active);
    } else {
      active.endDate = log.log_date;
    }
    previousDate = log.log_date;
  });

  return cycles;
}

export function getCycleLengths(cycles: Cycle[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < cycles.length; i++) {
    lengths.push(daysBetween(cycles[i - 1].startDate, cycles[i].startDate));
  }
  return lengths.filter((length) => length >= 18 && length <= 45);
}

export function weightedAverage(lengths: number[]): number {
  if (!lengths.length) return 28;
  let totalWeight = 0;
  let weightedSum = 0;

  lengths.forEach((len, i) => {
    const weight = i + 1;
    weightedSum += len * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

export function adjustAverageLength(avgLength: number, context: CycleLifestyleContext = {}) {
  let adjusted = avgLength;
  if (context.stressLevel === 'high') adjusted += 1;
  if (typeof context.sleepHours === 'number' && context.sleepHours < 5) adjusted += 1;
  return adjusted;
}

export function regularityScore(lengths: number[]) {
  if (lengths.length < 2) return lengths.length ? 80 : 0;
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  return Math.round(Math.max(0, 100 - variance));
}

export function buildCycleDayMap(logs: CycleLog[]) {
  const cycles = getPeriodCycles(logs);
  const map: Record<string, number> = {};

  logs.forEach((log) => {
    const cycle = [...cycles].reverse().find((item) => item.startDate <= log.log_date);
    if (cycle) map[log.log_date] = daysBetween(cycle.startDate, log.log_date) + 1;
  });

  return map;
}

export function findPatterns(logs: SymptomLog[], cycleDayMap: Record<string, number>) {
  const patterns: Record<string, number[]> = {};

  logs.forEach((log) => {
    const cycleDay = cycleDayMap[log.date];
    if (!cycleDay) return;

    log.symptoms.forEach((symptom) => {
      if (!patterns[symptom]) patterns[symptom] = [];
      patterns[symptom].push(cycleDay);
    });
  });

  return patterns;
}

export function generateInsights(patterns: Record<string, number[]>) {
  const insights: string[] = [];

  Object.entries(patterns).forEach(([symptom, days]) => {
    if (!days.length) return;
    const avgDay = days.reduce((a, b) => a + b, 0) / days.length;

    if (avgDay < 4) {
      insights.push(`${symptom} usually appears near the start of your cycle.`);
    } else if (avgDay >= 12 && avgDay <= 17) {
      insights.push(`${symptom} tends to show up around ovulation.`);
    } else if (avgDay >= 21) {
      insights.push(`${symptom} often appears in the luteal or PMS phase.`);
    }
  });

  return insights;
}

export function moodTrend(logs: SymptomLog[]) {
  return logs.map((log) => ({
    date: log.date,
    mood: log.mood,
  }));
}

export function parseVoiceInput(text: string) {
  const lower = text.toLowerCase();
  const symptoms: string[] = [];
  let mood: string | null = null;

  ['cramps', 'headache', 'bloating', 'nausea', 'back pain', 'breast tenderness'].forEach((symptom) => {
    if (lower.includes(symptom)) symptoms.push(symptom);
  });

  if (lower.includes('tired') || lower.includes('fatigue') || lower.includes('low energy')) mood = 'tired';
  if (lower.includes('emotional') || lower.includes('sad')) mood = 'emotional';
  if (lower.includes('great') || lower.includes('happy')) mood = 'great';
  if (lower.includes('crampy')) mood = 'crampy';

  return { symptoms, mood };
}

export function getCyclePrediction(logs: CycleLog[], context: CycleLifestyleContext = {}, todayIso = toIso(new Date())) {
  const cycles = getPeriodCycles(logs);
  if (cycles.length < 2) return null;

  const cycleLengths = getCycleLengths(cycles);
  if (!cycleLengths.length) return null;

  const averageLength = adjustAverageLength(weightedAverage(cycleLengths), context);
  const lastStart = cycles[cycles.length - 1].startDate;
  const nextPeriod = addDays(lastStart, averageLength);
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const pmsStart = addDays(nextPeriod, -7);
  const pmsEnd = addDays(nextPeriod, -1);
  const daysToPeriod = daysBetween(todayIso, nextPeriod);

  return {
    averageLength,
    nextPeriod,
    ovulation,
    fertileStart,
    fertileEnd,
    pmsStart,
    pmsEnd,
    phase: getCyclePhase(todayIso, cycles[cycles.length - 1], {
      ovulation,
      fertileStart,
      fertileEnd,
      pmsStart,
      pmsEnd,
    }),
    daysToPeriod,
    regularityScore: regularityScore(cycleLengths),
    cycleLengths,
  } satisfies CyclePrediction;
}

function getCyclePhase(
  todayIso: string,
  currentCycle: Cycle,
  windows: Pick<CyclePrediction, 'ovulation' | 'fertileStart' | 'fertileEnd' | 'pmsStart' | 'pmsEnd'>
): CyclePhase {
  if (todayIso >= currentCycle.startDate && todayIso <= (currentCycle.endDate ?? currentCycle.startDate)) return 'period';
  if (todayIso === windows.ovulation) return 'ovulation';
  if (todayIso >= windows.fertileStart && todayIso <= windows.fertileEnd) return 'fertile';
  if (todayIso >= windows.pmsStart && todayIso <= windows.pmsEnd) return 'pms';
  if (todayIso > windows.fertileEnd) return 'luteal';
  return 'follicular';
}

export function generateReminders(prediction: CyclePrediction | null) {
  const reminders: string[] = [];
  if (!prediction) return reminders;

  if (prediction.daysToPeriod === 2) reminders.push('Your period is likely in 2 days.');
  if (prediction.daysToPeriod >= 0 && prediction.daysToPeriod <= 7) {
    reminders.push(`PMS window is near. Expected period: ${prediction.nextPeriod}.`);
  }
  if (prediction.phase === 'luteal' || prediction.phase === 'pms') {
    reminders.push('You may feel lower energy today.');
  }
  if (prediction.phase === 'fertile' || prediction.phase === 'ovulation') {
    reminders.push('Fertility window is active.');
  }

  return reminders;
}

export function respondToCycleQuery(query: string, context: { phase?: CyclePhase; insights?: string[] }) {
  const lower = query.toLowerCase();
  if ((lower.includes('tired') || lower.includes('fatigue')) && (context.phase === 'luteal' || context.phase === 'pms')) {
    return 'Fatigue can be common in the luteal and PMS phases because progesterone rises after ovulation.';
  }
  if (lower.includes('cramp')) {
    return 'Cramps can happen around period days. If pain is severe, unusual, or disruptive, it is worth checking in with a clinician.';
  }
  if (lower.includes('fertile') || lower.includes('ovulation')) {
    return context.phase === 'fertile' || context.phase === 'ovulation'
      ? 'You appear to be in or near the fertility window based on recent cycle data.'
      : 'Your fertility window is estimated from ovulation, usually about 14 days before the next period.';
  }
  if (context.insights?.length) return context.insights[0];
  return 'I need more logged cycle and symptom data to give a useful pattern.';
}
