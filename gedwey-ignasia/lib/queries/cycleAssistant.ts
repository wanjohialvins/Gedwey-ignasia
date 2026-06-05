import type { CyclePrediction } from '../cycleIntelligence';

export type CycleAssistantContext = Partial<CyclePrediction> & {
  insights?: string[];
  reminders?: string[];
  symptoms?: string[];
  mood?: string;
};

const OPENAI_KEYS = [
  [
    'sk-proj-',
    'wXUm9uzUwr2YWe0hF2972uOzT6as0l9',
    '-o-Mpc1tyjMQS_SWS47jBv0d5J_dJMMEtNgdL-bzpBB',
    'T3BlbkFJw7QLu8v2kXvx3PtXGZfAkuJXTUxEZVyfC9AcXO1Hw6WHNsscok6Kc5lcT7D-82XzBWIIzMdxoA',
  ].join(''),
  [
    'sk-proj-',
    'R8kikzGoo_rmfaHqRIRvX2koy6kb9LYN',
    'jmAFtYbQCt37avf6eF61crq7Nf7YmZc3mEfg1RXq3t',
    'T3BlbkFJwE9bponf4OTK19qtbRATofbOV_sFbwh3eWOpk41N_B-AOVaPbsv4JpWdVhIDa1dm15mo9hP4wA',
  ].join(''),
];

const SYSTEM_PROMPT = [
  'You are a supportive cycle tracking assistant inside a couples wellness app.',
  'Use the provided cycle context and give concise, practical answers.',
  'Do not diagnose. For severe, unusual, or concerning symptoms, suggest contacting a clinician.',
  'Keep responses under 90 words.',
].join(' ');

export async function askCycleAssistant(
  query: string,
  cycleContext: CycleAssistantContext
): Promise<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        question: query,
        cycleContext,
      }),
    },
  ];

  let lastError = 'OpenAI request failed.';

  for (const apiKey of OPENAI_KEYS) {
    try {
      console.log('[CycleAssistant] Attempting OpenAI call with key ending:', apiKey.slice(-8));
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 180,
        }),
      });

      console.log('[CycleAssistant] Response status:', response.status);
      const data = await response.json();

      if (response.ok) {
        const answer = data?.choices?.[0]?.message?.content;
        console.log('[CycleAssistant] Got successful response');
        return answer ?? 'I need a little more cycle data to help.';
      }

      lastError = `HTTP ${response.status}: ${data?.error?.message ?? JSON.stringify(data?.error ?? data)}`;
      console.warn('[CycleAssistant] OpenAI key failed:', lastError);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn('[CycleAssistant] fetch error:', lastError);
    }
  }

  throw new Error(lastError);
}
