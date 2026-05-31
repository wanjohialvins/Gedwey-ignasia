export type GameMode = 'truth_or_dare' | 'would_you_rather' | 'this_or_that' | 'deep_questions' | 'rapid_fire';

export type GameCategory = 'fun' | 'deep' | 'playful' | 'mature';

export type GamePrompt = {
  mode: GameMode;
  category: GameCategory;
  text: string;
  optionA?: string;
  optionB?: string;
  isDare?: boolean;
  mature?: boolean;
};

export const GAME_MODES: { id: GameMode; title: string; subtitle: string }[] = [
  { id: 'truth_or_dare', title: 'Truth or Dare', subtitle: 'Alternate truths and dares by mood' },
  { id: 'would_you_rather', title: 'Would You Rather', subtitle: 'Pick a side and explain why' },
  { id: 'this_or_that', title: 'This or That', subtitle: 'Fast instinct picks — compare answers' },
  { id: 'deep_questions', title: 'Deep Questions', subtitle: 'Slow, meaningful reflections' },
  { id: 'rapid_fire', title: 'Rapid Fire', subtitle: 'Quick answers — see how aligned you are' },
];

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  fun: 'Fun',
  deep: 'Deep',
  playful: 'Playful',
  mature: 'Spicy',
};

/** Map Supabase game_cards row to legacy GamePrompt shape */
export const mapGameCardToPrompt = (card: {
  game_type: GameMode;
  category: GameCategory;
  prompt: string;
  option_a?: string | null;
  option_b?: string | null;
  is_dare?: boolean;
  age_gate?: boolean;
}): GamePrompt => ({
  mode: card.game_type,
  category: card.category,
  text: card.prompt,
  optionA: card.option_a ?? undefined,
  optionB: card.option_b ?? undefined,
  isDare: card.is_dare,
  mature: card.age_gate || card.category === 'mature',
});

export const BUCKET_LIST_STARTERS = [
  'Cook a meal from a country you have never visited',
  'Watch the sunrise together',
  'Write each other a letter and swap them',
  'Take a road trip with no fixed destination',
  'Learn a dance together',
  'Visit a museum and pick favourite pieces for each other',
  'Camp under the stars for one night',
  'Recreate your first date',
  'Start a photo album of tiny everyday moments',
  'Try a new sport or activity together',
  'Plant something and watch it grow',
  'Build a playlist that tells your love story',
  'Volunteer together for a cause you both care about',
  'Have a no-phones evening once a month',
  'Take a class together — pottery, cooking, anything',
  'Write down 10 dreams and compare lists',
  'Make a time capsule for your future selves',
  'Explore a neighbourhood in your city you have never been to',
  'Create a signature couple recipe',
  'Celebrate a made-up holiday just for the two of you',
];
