import type { GameCategory, GameMode } from './gamePrompts';
import type { GameCard } from './queries/gameCards';

/** Hand-written fallback when Supabase + cache are unavailable */
export const FALLBACK_GAME_CARDS: GameCard[] = [
  // truth_or_dare — fun
  { id: 'fb-tod-f1', game_type: 'truth_or_dare', category: 'fun', prompt: "What's your most embarrassing childhood memory?", option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-tod-f2', game_type: 'truth_or_dare', category: 'fun', prompt: "What's the weirdest dream you've ever had about me?", option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-tod-f3', game_type: 'truth_or_dare', category: 'fun', prompt: 'Do your best impression of me for 30 seconds.', option_a: null, option_b: null, is_dare: true, age_gate: false },
  { id: 'fb-tod-f4', game_type: 'truth_or_dare', category: 'fun', prompt: 'Send a voice note saying something genuinely kind about your partner.', option_a: null, option_b: null, is_dare: true, age_gate: false },
  // truth_or_dare — deep
  { id: 'fb-tod-d1', game_type: 'truth_or_dare', category: 'deep', prompt: "What's something you've always wanted to tell me but haven't?", option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-tod-d2', game_type: 'truth_or_dare', category: 'deep', prompt: 'Write your partner a 3-sentence letter about what they mean to you — read it aloud.', option_a: null, option_b: null, is_dare: true, age_gate: false },
  // truth_or_dare — playful
  { id: 'fb-tod-p1', game_type: 'truth_or_dare', category: 'playful', prompt: 'If we had a couple nickname, what should it be?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-tod-p2', game_type: 'truth_or_dare', category: 'playful', prompt: 'Create a new handshake together right now.', option_a: null, option_b: null, is_dare: true, age_gate: false },
  // would_you_rather
  { id: 'fb-wyr-f1', game_type: 'would_you_rather', category: 'fun', prompt: 'Would you rather never argue again or always win every argument?', option_a: 'Never argue', option_b: 'Always win', is_dare: false, age_gate: false },
  { id: 'fb-wyr-d1', game_type: 'would_you_rather', category: 'deep', prompt: 'Would you rather go back to when we first met or fast-forward 10 years?', option_a: 'Go back', option_b: 'Fast-forward 10 years', is_dare: false, age_gate: false },
  { id: 'fb-wyr-p1', game_type: 'would_you_rather', category: 'playful', prompt: 'Would you rather a sunrise walk or a midnight drive?', option_a: 'Sunrise walk', option_b: 'Midnight drive', is_dare: false, age_gate: false },
  // this_or_that
  { id: 'fb-tot-f1', game_type: 'this_or_that', category: 'fun', prompt: 'Movie night or Game night?', option_a: 'Movie night', option_b: 'Game night', is_dare: false, age_gate: false },
  { id: 'fb-tot-p1', game_type: 'this_or_that', category: 'playful', prompt: 'Coffee or tea?', option_a: 'Coffee', option_b: 'Tea', is_dare: false, age_gate: false },
  { id: 'fb-tot-d1', game_type: 'this_or_that', category: 'deep', prompt: 'Deep talks or Quiet closeness?', option_a: 'Deep talks', option_b: 'Quiet closeness', is_dare: false, age_gate: false },
  // deep_questions
  { id: 'fb-dq-d1', game_type: 'deep_questions', category: 'deep', prompt: 'What would help you feel more understood when we disagree?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-dq-f1', game_type: 'deep_questions', category: 'fun', prompt: 'What is a happy memory of us you want to recreate soon?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-dq-p1', game_type: 'deep_questions', category: 'playful', prompt: 'If our relationship had a theme song, what would it be and why?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  // rapid_fire
  { id: 'fb-rf-f1', game_type: 'rapid_fire', category: 'fun', prompt: 'Favourite season?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-rf-d1', game_type: 'rapid_fire', category: 'deep', prompt: 'Biggest fear?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  { id: 'fb-rf-p1', game_type: 'rapid_fire', category: 'playful', prompt: 'Coffee or tea?', option_a: null, option_b: null, is_dare: false, age_gate: false },
  // mature / spicy fallback
  { id: 'fb-mat-1', game_type: 'truth_or_dare', category: 'mature', prompt: 'Share one thing that makes you feel most desired by your partner.', option_a: null, option_b: null, is_dare: false, age_gate: true },
  { id: 'fb-mat-2', game_type: 'truth_or_dare', category: 'mature', prompt: 'Describe a fantasy you would feel comfortable exploring together.', option_a: null, option_b: null, is_dare: false, age_gate: true },
  { id: 'fb-mat-3', game_type: 'deep_questions', category: 'mature', prompt: 'What helps you feel emotionally safe during intimate moments?', option_a: null, option_b: null, is_dare: false, age_gate: true },
  { id: 'fb-mat-4', game_type: 'would_you_rather', category: 'mature', prompt: 'Would you rather slow sensual evenings or spontaneous passion?', option_a: 'Slow evenings', option_b: 'Spontaneous passion', is_dare: false, age_gate: true },
];

export const filterGameCards = (
  cards: GameCard[],
  mode: GameMode,
  category: 'all' | GameCategory,
  options: {
    matureEnabled?: boolean;
    matureConfirmed?: boolean;
    truthOrDareChoice?: 'truth' | 'dare' | 'any';
  } = {}
): GameCard[] => {
  const { matureEnabled = false, matureConfirmed = false, truthOrDareChoice = 'any' } = options;

  return cards.filter((card) => {
    if (card.game_type !== mode) return false;

    const isMatureCard = card.age_gate || card.category === 'mature';

    if (category === 'mature') {
      if (!isMatureCard) return false;
      if (!matureEnabled || !matureConfirmed) return false;
    } else if (isMatureCard) {
      if (!matureEnabled || !matureConfirmed) return false;
      if (category !== 'all') return false;
    } else if (category !== 'all' && card.category !== category) {
      return false;
    }

    if (mode === 'truth_or_dare' && truthOrDareChoice !== 'any') {
      if (truthOrDareChoice === 'truth' && card.is_dare) return false;
      if (truthOrDareChoice === 'dare' && !card.is_dare) return false;
    }
    return true;
  });
};

export const countGameCardsByMode = (cards: GameCard[]): Record<GameMode, number> => {
  const modes: GameMode[] = ['truth_or_dare', 'would_you_rather', 'this_or_that', 'deep_questions', 'rapid_fire'];
  return modes.reduce(
    (acc, mode) => {
      acc[mode] = cards.filter((c) => c.game_type === mode && !c.age_gate).length;
      return acc;
    },
    {} as Record<GameMode, number>
  );
};
