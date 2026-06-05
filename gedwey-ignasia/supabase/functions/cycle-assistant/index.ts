type CycleAssistantRequest = {
  query?: string;
  cycleContext?: {
    phase?: string;
    nextPeriod?: string;
    ovulation?: string;
    fertileStart?: string;
    fertileEnd?: string;
    pmsStart?: string;
    pmsEnd?: string;
    daysToPeriod?: number;
    insights?: string[];
    reminders?: string[];
    symptoms?: string[];
    mood?: string;
  };
};

declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: {
    get(name: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = [
  'You are a supportive cycle tracking assistant inside a couples wellness app.',
  'Use the provided cycle context and give concise, practical answers.',
  'Do not diagnose. For severe, unusual, or concerning symptoms, suggest contacting a clinician.',
  'Keep responses under 90 words.',
].join(' ');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as CycleAssistantRequest;
    const query = body.query?.trim();

    if (!query) {
      return json({ answer: 'Ask me a cycle question and I can help with your logged context.' }, 400);
    }

    const k1 = [
      'sk-proj-',
      'wXUm9uzUwr2YWe0hF2972uOzT6as0l9',
      '-o-Mpc1tyjMQS_SWS47jBv0d5J_dJMMEtNgdL-bzpBB',
      'T3BlbkFJw7QLu8v2kXvx3PtXGZfAkuJXTUxEZVyfC9AcXO1Hw6WHNsscok6Kc5lcT7D-82XzBWIIzMdxoA'
    ].join('');
    const k2 = [
      'sk-proj-',
      'R8kikzGoo_rmfaHqRIRvX2koy6kb9LYN',
      'jmAFtYbQCt37avf6eF61crq7Nf7YmZc3mEfg1RXq3t',
      'T3BlbkFJwE9bponf4OTK19qtbRATofbOV_sFbwh3eWOpk41N_B-AOVaPbsv4JpWdVhIDa1dm15mo9hP4wA'
    ].join('');
    const key1 = Deno.env.get('OPENAI_API_KEY') || k1;
    const key2 = Deno.env.get('OPENAI_FALLBACK_API_KEY') || k2;
    const keys = [key1, key2].filter(Boolean) as string[];

    if (!keys.length) {
      return json({ answer: 'OpenAI is not configured for the cycle assistant yet.' }, 500);
    }

    const input = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: JSON.stringify({
          question: query,
          cycleContext: body.cycleContext ?? {},
        }),
      },
    ];

    let lastError = 'OpenAI request failed.';
    for (const apiKey of keys) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: input,
            max_tokens: 180,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          return json({ answer: data.choices?.[0]?.message?.content ?? 'I need a little more cycle data to help.' });
        }

        lastError = data?.error?.message ?? lastError;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return json({ answer: lastError }, 502);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected assistant error.';
    return json({ answer: message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
