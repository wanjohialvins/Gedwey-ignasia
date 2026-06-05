import { supabase } from '../supabase';
import type { CyclePrediction } from '../cycleIntelligence';

export type CycleAssistantContext = Partial<CyclePrediction> & {
  insights?: string[];
  reminders?: string[];
  symptoms?: string[];
  mood?: string;
};

export async function askCycleAssistant(query: string, cycleContext: CycleAssistantContext) {
  const { data, error } = await supabase.functions.invoke<{ answer: string }>('cycle-assistant', {
    body: {
      query,
      cycleContext,
    },
  });

  if (error) throw new Error(error.message);
  return data?.answer ?? 'I need more data to help you.';
}
