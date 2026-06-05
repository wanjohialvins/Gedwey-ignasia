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

    const primaryKey = Deno.env.get('OPENAI_API_KEY');
    const fallbackKey = Deno.env.get('OPENAI_FALLBACK_API_KEY');
    const keys = [primaryKey, fallbackKey].filter(Boolean) as string[];

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
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          input,
          max_output_tokens: 180,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        return json({ answer: data.output_text ?? 'I need a little more cycle data to help.' });
      }

      lastError = data?.error?.message ?? lastError;
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
