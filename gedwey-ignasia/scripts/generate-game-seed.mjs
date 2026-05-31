/**
 * Generates supabase/seed-game-cards-data.sql
 * Target: 300 prompts per mode (100 fun + 100 deep + 100 playful) + 30 mature per mode
 * Run: node scripts/generate-game-seed.mjs
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  MODES,
  CATEGORIES,
  PER_CATEGORY,
  MATURE_PER_MODE,
  handWritten,
  matureBase,
  expansion,
} from './game-prompts-bank.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function esc(s) {
  return s.replace(/'/g, "''");
}

function row(game_type, category, prompt, opts = {}) {
  const { option_a = null, option_b = null, is_dare = false, age_gate = false } = opts;
  const oa = option_a ? `'${esc(option_a)}'` : 'NULL';
  const ob = option_b ? `'${esc(option_b)}'` : 'NULL';
  return `('${game_type}','${category}','${esc(prompt)}',${oa},${ob},${is_dare},${age_gate})`;
}

const promptKeys = new Set();
const allRows = [];

function normalizeKey(prompt) {
  return prompt
    .toLowerCase()
    .replace(/\(#[^)]*\)/g, '')
    .replace(/#\d+/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGarbage(prompt) {
  return (
    /#\d+|reflection \d+|pick fast\.?\s*\(|truth #|dare #|honest take on our|show me your best.*right now|answer in \d+ seconds|without overthinking/i.test(
      prompt
    ) || prompt.length < 8
  );
}

function addCard(game_type, category, prompt, opts = {}) {
  if (isGarbage(prompt)) return false;
  const key = `${game_type}|${category}|${normalizeKey(prompt)}`;
  if (promptKeys.has(key)) return false;
  promptKeys.add(key);
  allRows.push(row(game_type, category, prompt, opts));
  return true;
}

function countModeCat(mode, cat) {
  return allRows.filter((r) => r.startsWith(`('${mode}','${cat}'`)).length;
}

// --- Insert hand-written first ---
for (const mode of MODES) {
  for (const item of handWritten[mode]) {
    addCard(mode, item.category, item.prompt, {
      option_a: item.option_a,
      option_b: item.option_b,
      is_dare: !!item.is_dare,
    });
  }
}

// --- truth_or_dare: truths + dares from expansion ---
for (const cat of CATEGORIES) {
  const bank = expansion.truth_or_dare[cat];
  for (const prompt of bank.truths) {
    if (countModeCat('truth_or_dare', cat) >= PER_CATEGORY) break;
    addCard('truth_or_dare', cat, prompt, { is_dare: false });
  }
  for (const prompt of bank.dares) {
    if (countModeCat('truth_or_dare', cat) >= PER_CATEGORY) break;
    addCard('truth_or_dare', cat, prompt, { is_dare: true });
  }
}

// --- would_you_rather ---
const wyrContexts = [
  'on a rainy Sunday',
  'during a road trip',
  'on date night',
  'when we are tired',
  'on vacation',
  'for the rest of the year',
  'this weekend',
  'when friends are watching',
  'at home alone',
  'in public together',
];

for (const cat of CATEGORIES) {
  const pairs = expansion.would_you_rather[cat];
  for (const [a, b] of pairs) {
    if (countModeCat('would_you_rather', cat) >= PER_CATEGORY) break;
    addCard('would_you_rather', cat, `Would you rather ${a} or ${b}?`, { option_a: a, option_b: b });
  }
  // Fill remaining with contextual variants (unique phrasing, not #N)
  let ctxIdx = 0;
  while (countModeCat('would_you_rather', cat) < PER_CATEGORY && ctxIdx < 200) {
    const [a, b] = pairs[ctxIdx % pairs.length];
    const ctx = wyrContexts[Math.floor(ctxIdx / pairs.length) % wyrContexts.length];
    const variants = [
      `Would you rather ${a} or ${b} ${ctx}?`,
      `If we had to choose ${ctx}: ${a} or ${b}?`,
      `Between ${a} and ${b} — which wins ${ctx}?`,
    ];
    addCard('would_you_rather', cat, variants[ctxIdx % variants.length], { option_a: a, option_b: b });
    ctxIdx++;
  }
}

// --- this_or_that ---
const totPrefixes = ['Quick pick:', 'Choose one:', 'Your instinct:', 'No overthinking —', 'Go with your gut:'];

for (const cat of CATEGORIES) {
  const pairs = expansion.this_or_that[cat];
  for (const [a, b] of pairs) {
    if (countModeCat('this_or_that', cat) >= PER_CATEGORY) break;
    addCard('this_or_that', cat, `${a} or ${b}?`, { option_a: a, option_b: b });
  }
  let idx = 0;
  while (countModeCat('this_or_that', cat) < PER_CATEGORY && idx < 200) {
    const [a, b] = pairs[idx % pairs.length];
    const prefix = totPrefixes[Math.floor(idx / pairs.length) % totPrefixes.length];
    const prompts = [
      `${prefix} ${a} or ${b}?`,
      `${a} versus ${b} — which are you today?`,
      `Team ${a} or team ${b}?`,
    ];
    addCard('this_or_that', cat, prompts[idx % prompts.length], { option_a: a, option_b: b });
    idx++;
  }
}

// --- deep_questions ---
for (const cat of CATEGORIES) {
  const prompts = expansion.deep_questions[cat];
  for (const prompt of prompts) {
    if (countModeCat('deep_questions', cat) >= PER_CATEGORY) break;
    addCard('deep_questions', cat, prompt);
  }
  // Unique follow-up variants
  const suffixes = [
    'Tell me why.',
    'What comes to mind first?',
    'Be as honest as you can.',
    'Take your time with this one.',
    'There is no wrong answer.',
  ];
  let s = 0;
  while (countModeCat('deep_questions', cat) < PER_CATEGORY && s < 200) {
    const base = prompts[s % prompts.length];
    const suffix = suffixes[Math.floor(s / prompts.length) % suffixes.length];
    addCard('deep_questions', cat, `${base.replace(/\?$/, '')} — ${suffix}`);
    s++;
  }
}

// --- rapid_fire ---
for (const cat of CATEGORIES) {
  const prompts = expansion.rapid_fire[cat];
  for (const prompt of prompts) {
    if (countModeCat('rapid_fire', cat) >= PER_CATEGORY) break;
    addCard('rapid_fire', cat, prompt);
  }
  const openers = ['Quick:', 'Fast:', 'Go:', 'First thought:', 'Instant answer:'];
  let r = 0;
  while (countModeCat('rapid_fire', cat) < PER_CATEGORY && r < 200) {
    const base = prompts[r % prompts.length].replace(/\?$/, '');
    const opener = openers[Math.floor(r / prompts.length) % openers.length];
    addCard('rapid_fire', cat, `${opener} ${base}?`);
    r++;
  }
}

// --- Mature: 30 per mode (deduped across modes — same 30 prompts each mode is OK per original design) ---
for (const mode of MODES) {
  for (const m of matureBase) {
    addCard(mode, 'mature', m.prompt, { is_dare: m.is_dare, age_gate: true });
  }
}

// --- Stats ---
const stats = {};
for (const mode of MODES) {
  stats[mode] = {};
  for (const cat of [...CATEGORIES, 'mature']) {
    stats[mode][cat] = countModeCat(mode, cat);
  }
}

let sql = `-- GEDWEY IGNASIA — GAME CARDS DATA SEED
-- Generated: ${new Date().toISOString()}
-- Total: ${allRows.length} rows | ${PER_CATEGORY} per category per mode + ${MATURE_PER_MODE} mature/mode
-- Deduped by normalized prompt text. No template garbage.
-- Run seed-game-cards.sql first (creates table), then this file.

DELETE FROM game_cards;

INSERT INTO game_cards (game_type, category, prompt, option_a, option_b, is_dare, age_gate) VALUES
`;

const BATCH = 100;
for (let i = 0; i < allRows.length; i += BATCH) {
  const chunk = allRows.slice(i, i + BATCH);
  if (i > 0) sql += ',\n';
  sql += chunk.join(',\n');
}

sql += ';\n\n';
for (const mode of MODES) {
  sql += `-- ${mode}: ${JSON.stringify(stats[mode])}\n`;
}

const outPath = join(__dirname, '..', 'supabase', 'seed-game-cards-data.sql');
writeFileSync(outPath, sql);
console.log('Wrote', outPath);
console.log('Total rows:', allRows.length);
console.log('Unique prompt keys:', promptKeys.size);
console.log(JSON.stringify(stats, null, 2));
