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

  if (lower.includes('diet') || lower.includes('food') || lower.includes('eat') || lower.includes('nutrition')) {
    if (context.phase === 'period') {
      return 'During your period, focus on iron-rich foods (leafy greens, lean meats), vitamin C to aid absorption, and anti-inflammatory foods like ginger or dark chocolate to ease cramps. Stay hydrated!';
    }
    if (context.phase === 'pms' || context.phase === 'luteal') {
      return 'In your luteal/PMS phase, complex carbs (oats, sweet potatoes) can help stabilize blood sugar and mood. Healthy fats and magnesium-rich foods (bananas, pumpkin seeds) can curb cravings.';
    }
    return 'For general cycle wellness, prioritize whole foods, healthy fats (avocado, nuts), lean proteins, and plenty of water. Adjusting nutrition to your cycle phase can help support natural hormone fluctuations.';
  }

  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('gym') || lower.includes('run')) {
    if (context.phase === 'period' || context.phase === 'pms') {
      return 'When energy is lower during PMS and period days, gentle movement like yoga, walking, or light stretching is ideal. Listen to your body and prioritize rest over intense workouts.';
    }
    if (context.phase === 'fertile' || context.phase === 'ovulation' || context.phase === 'follicular') {
      return 'During follicular and ovulation phases, estrogen rises, boosting your energy and strength. This is a great window for high-intensity workouts, strength training, or challenging runs!';
    }
    return 'Tune your workouts to your energy levels. High-energy phases (follicular/ovulation) are great for strength and intensity, while low-energy phases (luteal/period) benefit from restorative exercises like walking or yoga.';
  }

  if (lower.includes('partner') || lower.includes('couple') || lower.includes('husband') || lower.includes('boyfriend') || lower.includes('help')) {
    return 'Sharing your cycle with your partner helps them understand your emotional and physical changes. In low-energy phases (PMS/period), they can support you by offering extra rest, soothing comfort, or helping with daily tasks.';
  }

  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('rest') || lower.includes('insomnia') || lower.includes('fatigue')) {
    if (context.phase === 'luteal' || context.phase === 'pms') {
      return 'Fatigue is common in the luteal/PMS phase due to rising progesterone and dropping estrogen. Try creating a winding-down routine, keeping your room cool, and avoiding caffeine in the afternoon.';
    }
    return 'Aim for 7-9 hours of quality sleep. Fatigue can vary across your cycle, especially dropping right before your period. Prioritize consistent sleep times and relaxing evening rituals.';
  }

  if (lower.includes('mood') || lower.includes('sad') || lower.includes('emotional') || lower.includes('anxious') || lower.includes('irrit')) {
    return 'Hormonal shifts, especially the drop in estrogen and progesterone during the PMS phase, can cause mood swings, anxiety, or irritability. Regular rest, mindfulness, and self-compassion can help navigate these waves.';
  }

  if (lower.includes('cramp') || lower.includes('pain') || lower.includes('hurt') || lower.includes('ache')) {
    return 'Mild cramps right before or during your period are normal as the uterus contracts. Applying heat, drinking warm tea, or taking gentle walks can help. If pain is severe, constant, or disruptive, please consult a healthcare professional.';
  }

  if (lower.includes('fertile') || lower.includes('ovulation') || lower.includes('pregnancy') || lower.includes('conceive')) {
    return context.phase === 'fertile' || context.phase === 'ovulation'
      ? 'Based on your logs, you are currently in or near your fertile window. Ovulation is the day the egg is released, usually about 14 days before your next period.'
      : 'Your fertile window spans the 5 days before ovulation and the day of ovulation itself. This is estimated based on your average cycle length and recent logs.';
  }

  if (context.insights?.length) {
    return `Here is a pattern from your logged data: ${context.insights[0]}`;
  }

  return 'I am currently operating in offline mode. Ask a question about symptoms, mood, diet, exercise, partner support, or sleep to get smart cycle recommendations!';
}
