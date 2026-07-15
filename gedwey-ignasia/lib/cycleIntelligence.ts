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

const toIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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
  const phase = context.phase;

  // ── DIET & NUTRITION ──────────────────────────────────────────────────────
  if (lower.includes('diet') || lower.includes('food') || lower.includes('eat') || lower.includes('nutrition') || lower.includes('craving') || lower.includes('hungry')) {
    if (phase === 'period') {
      return 'Oh babe, your body is working hard right now! \u{1F497} Focus on iron-rich foods \u2014 leafy greens, lean meats, lentils \u2014 and pair them with vitamin C (oranges, bell peppers) to boost absorption. Dark chocolate and ginger tea can genuinely help ease cramps too. Stay hydrated, luv.';
    }
    if (phase === 'pms' || phase === 'luteal') {
      return 'Luv, those pre-period cravings are SO real and completely normal. Complex carbs like oats and sweet potatoes help stabilize your blood sugar and mood. Magnesium-rich foods \u2014 bananas, pumpkin seeds, dark leafy greens \u2014 can also ease that restless, irritable feeling. And yes, a little chocolate is totally allowed \u{1F36B}';
    }
    if (phase === 'follicular' || phase === 'ovulation') {
      return "You're in your power phase girl! \u{1F338} This is when your estrogen is rising and your energy is naturally higher. Load up on whole foods, lean proteins, and good fats (avocado, salmon, nuts) to sustain that glow. Your gut absorption is also better now, so it's a great time to eat nutritiously.";
    }
    return 'For overall cycle wellness, think whole foods, healthy fats like avocado and nuts, lean proteins, and lots of water. Tuning your diet to each phase of your cycle can genuinely help balance your hormones and energy over time. \u{1F957}';
  }

  // ── EXERCISE & MOVEMENT ───────────────────────────────────────────────────
  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('gym') || lower.includes('run') || lower.includes('yoga') || lower.includes('walk') || lower.includes('sport')) {
    if (phase === 'period') {
      return "Babe, give yourself grace on period days. \u{1F495} Gentle movement \u2014 slow walks, restorative yoga, or light stretching \u2014 is plenty. If you feel okay for more, go for it, but rest is just as valid as a full workout right now. Your body is literally shedding its uterine lining \u2014 that's effort enough!";
    }
    if (phase === 'pms' || phase === 'luteal') {
      return "In your luteal phase, energy tends to dip and your body needs more recovery time. Swap high-intensity sessions for Pilates, swimming, or a peaceful walk. It's not giving up \u2014 it's training smart with your cycle. \u{1F9D8}";
    }
    if (phase === 'follicular') {
      return "Yes girl, this is your moment! \u{1F525} Rising estrogen in your follicular phase boosts strength, coordination, and endurance. It's literally the best time to try a new class, push harder in the gym, or go for that long run you've been thinking about.";
    }
    if (phase === 'ovulation' || phase === 'fertile') {
      return 'Peak performance phase! \u{1F4AA} Estrogen is at its highest right now, meaning your pain tolerance is up and your energy is peaking. Strength training, HIIT, dancing \u2014 anything high-energy is your friend this week. Enjoy it!';
    }
    return 'Syncing your workouts with your cycle is a total game changer. High-energy phases (follicular/ovulation) love strength and intensity, while the luteal and period phases thrive with gentle, restorative movement. Listen to your body \u2014 it always knows. \u{1F319}';
  }

  // ── SLEEP & FATIGUE ───────────────────────────────────────────────────────
  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('rest') || lower.includes('insomnia') || lower.includes('fatigue') || lower.includes('exhausted') || lower.includes('energy')) {
    if (phase === 'luteal' || phase === 'pms') {
      return "Oh luv, that drained feeling in your luteal phase is 100% real \u2014 rising progesterone makes your body run warmer and your sleep lighter. Try a consistent wind-down routine, keep your room cool, limit screen time before bed, and go easy on caffeine after 2pm. You're not lazy, your hormones are just extra active right now. \u{1F49C}";
    }
    if (phase === 'period') {
      return "It makes total sense that you're exhausted on period days, babe. Blood loss + cramping + hormonal shifts = a lot. Prioritize sleep, nap if you can, and don't feel guilty about a slower day. Iron-rich foods can help replenish your energy too. \u{1FAF6}";
    }
    if (phase === 'follicular' || phase === 'ovulation') {
      return "Your energy should be rising right now as estrogen climbs! \u{2728} If you're still feeling fatigued, make sure you're getting 7\u20139 hours of quality sleep, eating enough protein, and drinking enough water. Low iron or dehydration can zap energy even during your high-energy phases.";
    }
    return 'Aim for 7\u20139 hours of quality sleep throughout your cycle \u2014 but know that your sleep quality naturally shifts. Progesterone in the luteal phase can cause restless nights, while the follicular phase tends to bring deeper, more refreshing sleep. Consistency is key. \u{1F634}';
  }

  // ── MOOD & EMOTIONS ───────────────────────────────────────────────────────
  if (lower.includes('mood') || lower.includes('sad') || lower.includes('emotional') || lower.includes('anxious') || lower.includes('irrit') || lower.includes('cry') || lower.includes('overwhelm') || lower.includes('angry') || lower.includes('depress')) {
    if (phase === 'pms' || phase === 'luteal') {
      return "Oh babe, I hear you. \u{1F497} The emotional intensity before your period is so valid \u2014 it's not 'just being dramatic.' The drop in estrogen and progesterone in your luteal/PMS phase directly affects your serotonin levels. That's a REAL chemical shift. Be extra gentle with yourself, lean into comfort, and know this wave will pass.";
    }
    if (phase === 'period') {
      return "Feeling emotionally tender during your period? Completely makes sense. Hormones are at their lowest point right now, and that can bring heavy feelings. Give yourself the grace to feel it, rest in it, and not push through it. You don't have to be productive every day. \u{1F327}\uFE0F\u{1F49C}";
    }
    if (phase === 'follicular' || phase === 'ovulation') {
      return "This phase usually brings a natural mood lift! Rising estrogen boosts your serotonin and confidence. If you're still feeling low, check in on your sleep, hydration, and stress levels \u2014 those can all work against your natural hormone highs. \u{1F338}";
    }
    return "Your moods across the cycle are hormone-driven and deeply real. In the luteal and PMS phases especially, emotional sensitivity rises. Journaling, movement, rest, and connection with people who get you can all help. You're not 'too much' \u2014 you're cyclical, and that's a superpower. \u{1F49C}";
  }

  // ── CRAMPS & PAIN ─────────────────────────────────────────────────────────
  if (lower.includes('cramp') || lower.includes('pain') || lower.includes('hurt') || lower.includes('ache') || lower.includes('breast') || lower.includes('sore')) {
    if (lower.includes('breast') || lower.includes('boob') || lower.includes('chest')) {
      return "Breast tenderness is super common in the luteal and PMS phases, babe \u2014 rising progesterone causes fluid retention in breast tissue. A supportive bra and reducing caffeine and salt can help ease the discomfort. If it's severe, always worth a check-in with your OBGYN. \u{1F495}";
    }
    return 'Mild cramps before or during your period are normal as your uterus contracts. A heating pad, warm ginger or chamomile tea, or a gentle walk can all bring real relief. \u{1F33F} That said, babe \u2014 if your cramps are severe, stopping you from daily activities, or getting worse over time, please check in with your OBGYN. You deserve to not be in pain.';
  }

  // ── BLOATING ─────────────────────────────────────────────────────────────
  if (lower.includes('bloat') || lower.includes('puffy') || lower.includes('swollen') || lower.includes('full')) {
    return "Ugh, bloating before and during your period is SO uncomfortable! \u{1F629} Estrogen and progesterone shifts cause your body to retain water and slow digestion. Warm herbal teas (peppermint, ginger), cutting back on salty foods, and light movement like walking or yoga can genuinely help. You're not imagining it \u2014 your hormones are literally affecting your gut.";
  }

  // ── FERTILITY & OVULATION ─────────────────────────────────────────────────
  if (lower.includes('fertile') || lower.includes('ovulation') || lower.includes('pregnancy') || lower.includes('conceive') || lower.includes('baby') || lower.includes('ttc')) {
    if (phase === 'fertile' || phase === 'ovulation') {
      return "Based on your logs, you're currently in or near your fertile window! \u{1F31F} Ovulation is when the egg is released \u2014 usually around 14 days before your next period. This is your body's natural conception peak. If you're TTC, now is a great time!";
    }
    return 'Your fertile window spans the 5 days before ovulation plus the day of ovulation itself. Tracking BBT (basal body temperature) or cervical mucus changes alongside your log data gives you the clearest picture. Keep logging and your predictions will sharpen! \u{1F95A}';
  }

  // ── DISCHARGE & CERVICAL MUCUS ────────────────────────────────────────────
  if (lower.includes('discharge') || lower.includes('mucus') || lower.includes('cervical') || lower.includes('spotting') || lower.includes('brown')) {
    if (lower.includes('brown') || lower.includes('spotting')) {
      return "Brown discharge or light spotting around your period is usually just old blood leaving your uterus \u2014 completely normal, babe! Mid-cycle spotting can sometimes signal ovulation. That said, if spotting is heavy, painful, or frequent, it's worth a quick check-in with your doctor. \u{1F495}";
    }
    return 'Changes in discharge throughout your cycle are normal and actually tell you a lot! Around ovulation, discharge becomes clear, slippery, and stretchy \u2014 like egg whites \u2014 signalling your fertile window. Post-ovulation it becomes thicker and white. Your body is communicating with you. \u{1F338}';
  }

  // ── SKIN & ACNE ───────────────────────────────────────────────────────────
  if (lower.includes('skin') || lower.includes('acne') || lower.includes('breakout') || lower.includes('pimple') || lower.includes('glow')) {
    if (phase === 'pms' || phase === 'luteal') {
      return "Hormonal breakouts before your period are so common and SO frustrating! \u{1F629} Rising progesterone increases oil production, clogging pores. Keep your routine gentle \u2014 harsh products can make it worse. Staying hydrated, reducing sugar, and managing stress all help. And remember, it clears after your period starts! \u{2728}";
    }
    if (phase === 'follicular' || phase === 'ovulation') {
      return 'Your skin is probably glowing right now! \u{1F31F} Rising estrogen boosts collagen and reduces oiliness. This is a great time for nourishing face masks \u2014 your skin will absorb them beautifully.';
    }
    return 'Your skin changes throughout your cycle because of shifting hormones. Expect clearer, more radiant skin during the follicular and ovulation phases, and more oiliness or breakouts in the luteal and PMS phases. A consistent, gentle skincare routine goes a long way. \u{1F4A7}';
  }

  // ── STRESS & MENTAL HEALTH ────────────────────────────────────────────────
  if (lower.includes('stress') || lower.includes('burnout') || lower.includes('mental') || lower.includes('panic') || lower.includes('anxiety')) {
    if (phase === 'pms' || phase === 'luteal') {
      return "Stress and anxiety can genuinely amplify in the luteal/PMS phase \u2014 your body is already in a low-estrogen state and stress hormones pile on top. Even short bursts of calm (5 minutes of deep breathing, a walk, journaling) can break the spiral. You got this, babe. \u{1F49C}";
    }
    return 'Chronic stress can actually delay or disrupt your period by affecting cortisol and throwing off ovulation timing. Taking rest seriously is literally cycle health. Little rituals \u2014 5 minutes of stillness, a warm bath, or creative time \u2014 add up more than you know. \u{1F319}';
  }

  // ── HEADACHE & MIGRAINE ───────────────────────────────────────────────────
  if (lower.includes('headache') || lower.includes('migraine') || lower.includes('nausea')) {
    if (phase === 'period' || phase === 'pms') {
      return "Hormonal headaches just before your period are caused by the sharp drop in estrogen. Staying well hydrated, keeping caffeine consistent, and resting can all help. If migraines are severe or recurring, please mention them to your OBGYN \u2014 hormonal migraines are very treatable. \u{1F495}";
    }
    return 'Headaches can pop up around ovulation and PMS due to estrogen fluctuations. Staying hydrated, keeping a regular sleep schedule, and managing stress are your first lines of defense. Track when they happen \u2014 the pattern might tell you a lot. \u{1F50D}';
  }

  // ── MISSED / LATE / IRREGULAR PERIOD ─────────────────────────────────────
  if (lower.includes('miss') || lower.includes('late') || lower.includes('irregular') || lower.includes('no period') || lower.includes('skipped')) {
    return "Babe, a late or missed period can happen for lots of reasons beyond pregnancy \u2014 high stress, under-eating, intense exercise, illness, or hormonal shifts can all delay things. If it's been more than 6\u20138 weeks or has been irregular for several cycles, please check in with your OBGYN. You deserve proper care and answers. \u{1F497}";
  }

  // ── WEIGHT & WATER RETENTION ──────────────────────────────────────────────
  if (lower.includes('weight') || lower.includes('water retention') || lower.includes('retain')) {
    return "Feeling heavier before your period? That's water retention caused by progesterone, and it's super common. The scale can shift 2\u20135 lbs just from fluid changes across your cycle \u2014 that is NOT fat gain. Reducing salt, drinking more water, and cutting refined carbs can help you feel less puffy. \u{1F4A7}";
  }

  // ── LIBIDO & INTIMACY ─────────────────────────────────────────────────────
  if (lower.includes('libido') || lower.includes('sex') || lower.includes('desire') || lower.includes('intimacy') || lower.includes('intimate')) {
    if (phase === 'ovulation' || phase === 'fertile') {
      return "Your libido is probably naturally higher right now \u2014 estrogen and testosterone both peak around ovulation! \u{1F338} This is a great time to feel deeply connected with your partner. Enjoy that energy, babe.";
    }
    if (phase === 'pms' || phase === 'luteal' || phase === 'period') {
      return "Lower desire during your luteal/PMS/period phases is completely normal. Dropping hormones naturally pull your libido down. Being honest with yourself and your partner about where you're at is always the kindest thing. No pressure, babe. \u{1F49C}";
    }
    return "Libido naturally ebbs and flows across your cycle! It tends to peak around ovulation and dip in the luteal and period phases. This is completely normal and doesn't reflect anything about your relationship \u2014 it's just hormones doing their thing.";
  }

  // ── PARTNER SUPPORT ───────────────────────────────────────────────────────
  if (lower.includes('partner') || lower.includes('husband') || lower.includes('boyfriend') || lower.includes('girlfriend') || lower.includes('spouse')) {
    return "Sharing your cycle with your partner is such a beautiful form of vulnerability! \u{1F495} When they understand that your energy, mood, and needs genuinely shift throughout the month, it takes so much pressure off both of you. During low phases (PMS/period), they can show up with warmth and patience. During your high phases, you'll probably be the one pouring energy right back in!";
  }

  // ── TRACKING & LOGGING ────────────────────────────────────────────────────
  if (lower.includes('track') || lower.includes('log') || lower.includes('record') || lower.includes('period start') || lower.includes('period end')) {
    return "Yay, you're logging! \u{1F4DD} The more consistently you track \u2014 period dates, flow, symptoms, mood \u2014 the smarter your predictions become. Even just 2\u20133 cycles of data will give you much clearer patterns. You're building a personalised map of your body, and that's genuinely powerful.";
  }

  // ── CYCLE LENGTH & REGULARITY ─────────────────────────────────────────────
  if (lower.includes('cycle length') || lower.includes('regular') || lower.includes('average') || lower.includes('how long') || lower.includes('normal cycle')) {
    return "The average cycle is 28 days, but healthy cycles range from 21 to 35 days. What matters most is that YOUR cycle is consistent for you. Small variations of 1\u20133 days are normal. Bigger or more frequent irregularities are worth mentioning to your doctor. \u{1F495}";
  }

  // ── SELF CARE ─────────────────────────────────────────────────────────────
  if (lower.includes('self care') || lower.includes('selfcare') || lower.includes('wellness') || lower.includes('relax') || lower.includes('bath') || lower.includes('pamper') || lower.includes('warm')) {
    if (phase === 'period' || phase === 'pms') {
      return "This is peak self-care season, babe! \u{1F6C1} A warm bath with Epsom salts, a heating pad for cramps, your favourite comfort show, herbal tea, and soft lighting. Your body is doing a lot right now \u2014 honour that by slowing down. You deserve to be held gently, even if just by yourself. \u{1F497}";
    }
    return "Self-care isn't a luxury \u2014 it's literally cycle support! Rest, nourishment, gentle movement, and joy all feed your hormonal health. Whatever helps you feel safe, seen, and restored is exactly right for you. \u{1F338}";
  }

  // ── VITAMINS & SUPPLEMENTS ────────────────────────────────────────────────
  if (lower.includes('vitamin') || lower.includes('supplement') || lower.includes('iron') || lower.includes('magnesium') || lower.includes('omega')) {
    return "Great question! Magnesium can ease PMS symptoms, omega-3s help reduce inflammation and cramps, and iron is key to replenish after your period. That said, babe \u2014 always talk to your OBGYN or a nutritionist before starting supplements, because the right dose matters. \u{1F495}";
  }

  // ── BBT & TEMPERATURE ─────────────────────────────────────────────────────
  if (lower.includes('temperature') || lower.includes('bbt') || lower.includes('basal')) {
    return "Basal Body Temperature (BBT) tracking is so powerful! \u{1F321}\uFE0F Your temperature dips slightly before ovulation, then rises and stays elevated for the rest of your luteal phase. Tracking it every morning before getting up \u2014 even a 0.1\u20130.2\u00b0C shift matters \u2014 can confirm exactly when you ovulated.";
  }

  // ── ABOUT LUNA ────────────────────────────────────────────────────────────
  if (lower.includes('luna') || lower.includes('how do you') || lower.includes('what can you') || lower.includes('what do you know')) {
    return "Hey luv! \u{1F497} I'm Luna, your cycle-tracking bestie inside Gedwey Ignasia. I can help you understand your cycle phases, suggest self-care tips, talk through symptoms, mood patterns, nutrition, sleep, exercise, and so much more. The more you log, the more personalised I get. What's on your mind today?";
  }

  // ── LOGGED INSIGHTS ───────────────────────────────────────────────────────
  if (context.insights?.length) {
    return `Oh, I noticed something from your logged data, babe! \u{1F4A1} ${context.insights[0]} Patterns like these are exactly why consistent tracking is so powerful \u2014 your body is speaking and you're learning to hear it. \u{1F338}`;
  }

  // ── PHASE-AWARE GENERIC FALLBACK ──────────────────────────────────────────
  if (phase === 'period') {
    return "You're in your period phase right now, luv. \u{1F319} It's a time for rest, warmth, and nourishment. Is there something specific you're feeling or wondering about? I'm here to help \u2014 whether it's cramps, mood, food, or just needing to talk it through. \u{1F497}";
  }
  if (phase === 'pms' || phase === 'luteal') {
    return "You're in your luteal/PMS phase \u2014 energy often dips and emotions can feel bigger right now. That's completely real and valid. What are you experiencing? Ask me about self-care, mood, cravings, sleep, or anything else on your mind. \u{1F49C}";
  }
  if (phase === 'ovulation' || phase === 'fertile') {
    return "You're in your fertile/ovulation window! \u{2728} Energy and confidence tend to be higher around now. What's on your mind \u2014 fertility, energy, mood, or something else? I'm here, babe!";
  }
  if (phase === 'follicular') {
    return "You're in your follicular phase \u2014 a fresh start after your period! \u{1F338} Estrogen is rising and your body is rebuilding. What would you like to know? Diet, exercise, mood, skin \u2014 I'm ready to chat!";
  }

  return "Hey babe! I'm here for you \u{1F497} Try asking me about cramps, bloating, mood, sleep, diet, exercise, skin, your fertile window, or how to make the most of your current phase. The more you share, the better I can support you! \u{1F319}";
}

