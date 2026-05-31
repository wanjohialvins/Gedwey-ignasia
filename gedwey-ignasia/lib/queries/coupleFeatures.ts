import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { isNetworkError, markOffline, markOnline } from '../networkStatus';
import { enqueueMutation } from '../offlineQueue';

export type ImportantDate = {
  id: string;
  created_at: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  event_date: string;
  repeats_yearly: boolean;
  notes: string | null;
  profiles?: { display_name: string | null } | null;
};

export const useImportantDates = (coupleId: string) => {
  return useQuery<ImportantDate[], Error>({
    queryKey: ['importantDates', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('important_dates')
        .select('*, profiles:created_by(display_name)')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as ImportantDate[];
    },
    enabled: !!coupleId,
  });
};

export const useCreateImportantDate = () => {
  const qc = useQueryClient();
  return useMutation<
    ImportantDate,
    Error,
    { coupleId: string; userId: string; title: string; eventDate: string; notes?: string }
  >({
    mutationFn: async (p) => {
      try {
        const { data, error } = await supabase
          .from('important_dates')
          .insert({
            couple_id: p.coupleId,
            created_by: p.userId,
            title: p.title,
            event_date: p.eventDate,
            notes: p.notes || null,
          })
          .select('*, profiles:created_by(display_name)')
          .single();
        if (error) throw new Error(error.message);
        markOnline();
        return data as ImportantDate;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) {
          markOffline();
          await enqueueMutation('important_dates', 'insert', {
            couple_id: p.coupleId,
            created_by: p.userId,
            title: p.title,
            event_date: p.eventDate,
            notes: p.notes || null,
          });
          return { id: `temp-${Date.now()}`, created_at: new Date().toISOString(), couple_id: p.coupleId, created_by: p.userId, title: p.title, event_date: p.eventDate, repeats_yearly: false, notes: p.notes || null } as ImportantDate;
        }
        throw err instanceof Error ? err : new Error(message);
      }
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['importantDates', d.couple_id] }),
  });
};

export const useDeleteImportantDate = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; coupleId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('important_dates').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['importantDates', v.coupleId] }),
  });
};

export const daysUntilDate = (dateStr: string, recurring = true): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(dateStr + 'T00:00:00');
  event.setHours(0, 0, 0, 0);
  if (recurring) {
    const thisYear = new Date(today.getFullYear(), event.getMonth(), event.getDate());
    if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
    return Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
  }
  return Math.ceil((event.getTime() - today.getTime()) / 86400000);
};

export type CycleLog = {
  id: string;
  log_date: string;
  couple_id: string;
  user_id: string;
  flow_strength: string | null;
  mood: string | null;
  symptoms: string | null;
  notes: string | null;
  predicted_next: string | null;
  profiles?: { display_name: string | null } | null;
};

export const useCycleLogs = (coupleId: string) => {
  return useQuery<CycleLog[], Error>({
    queryKey: ['cycleLogs', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('cycle_logs')
        .select('*, profiles:user_id(display_name)')
        .eq('couple_id', coupleId)
        .order('log_date', { ascending: false })
        .limit(90);
      if (error) throw new Error(error.message);
      return (data || []) as CycleLog[];
    },
    enabled: !!coupleId,
    refetchInterval: 8000,
  });
};

export const useUpsertCycleLog = () => {
  const qc = useQueryClient();
  return useMutation<
    CycleLog,
    Error,
    {
      coupleId: string;
      userId: string;
      logDate: string;
      flowStrength?: string;
      mood?: string;
      symptoms?: string;
      notes?: string;
      predictedNext?: string;
    }
  >({
    mutationFn: async (p) => {
      try {
        const { data, error } = await supabase
          .from('cycle_logs')
          .upsert(
            {
              couple_id: p.coupleId,
              user_id: p.userId,
              log_date: p.logDate,
              flow_strength: p.flowStrength || null,
              mood: p.mood || null,
              symptoms: p.symptoms || null,
              notes: p.notes || null,
              predicted_next: p.predictedNext || null,
            },
            { onConflict: 'couple_id,log_date' }
          )
          .select('*, profiles:user_id(display_name)')
          .single();
        if (error) throw new Error(error.message);
        markOnline();
        return data as CycleLog;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) {
          markOffline();
          await enqueueMutation('cycle_logs', 'upsert', {
            couple_id: p.coupleId,
            user_id: p.userId,
            log_date: p.logDate,
            flow_strength: p.flowStrength || null,
            mood: p.mood || null,
            symptoms: p.symptoms || null,
            notes: p.notes || null,
            predicted_next: p.predictedNext || null,
          });
          return { id: `temp-${Date.now()}`, couple_id: p.coupleId, user_id: p.userId, log_date: p.logDate, flow_strength: p.flowStrength || null, mood: p.mood || null, symptoms: p.symptoms || null, notes: p.notes || null, predicted_next: p.predictedNext || null } as CycleLog;
        }
        throw err instanceof Error ? err : new Error(message);
      }
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['cycleLogs', d.couple_id] }),
  });
};

export type CouplePet = {
  id: string;
  couple_id: string;
  name: string;
  hunger: number;
  happiness: number;
  cleanliness: number;
  last_fed_at: string | null;
  last_played_at: string | null;
  last_bathed_at: string | null;
};

const hoursSince = (ts: string | null) =>
  ts ? (Date.now() - new Date(ts).getTime()) / 3600000 : 48;

/** Time-based decay so stats feel alive between care sessions */
export const applyPetDecay = (pet: CouplePet): { pet: CouplePet; changed: boolean } => {
  const fedHours = hoursSince(pet.last_fed_at);
  const playHours = hoursSince(pet.last_played_at ?? pet.last_fed_at);
  const bathHours = hoursSince(pet.last_bathed_at);

  let hunger = Math.max(0, pet.hunger - Math.floor(fedHours * 4));
  let happiness = Math.max(0, pet.happiness - Math.floor(playHours * 2));
  let cleanliness = Math.max(0, pet.cleanliness - Math.floor(bathHours * 3));

  if (hunger < 30) happiness = Math.max(0, happiness - 8);
  if (cleanliness < 25) happiness = Math.max(0, happiness - 5);
  if (hunger > 70 && cleanliness > 60 && happiness < 90) happiness = Math.min(100, happiness + 2);

  const changed =
    hunger !== pet.hunger || happiness !== pet.happiness || cleanliness !== pet.cleanliness;

  return { pet: { ...pet, hunger, happiness, cleanliness }, changed };
};

export const getPetMood = (pet: CouplePet) => {
  if (pet.hunger < 25) return { emoji: '😿', message: 'Hungry! Feed your cat soon.' };
  if (pet.cleanliness < 25) return { emoji: '🙀', message: 'Getting messy — time for a bath.' };
  if (pet.happiness < 30) return { emoji: '😾', message: 'Needs attention — scratch and play!' };
  if (pet.hunger > 75 && pet.happiness > 75 && pet.cleanliness > 60) {
    return { emoji: '😸', message: 'Purring happily! Great teamwork.' };
  }
  return { emoji: '🐱', message: 'Doing okay — keep caring together.' };
};

export const getPetCareHint = (pet: CouplePet) => {
  const stats = [
    { key: 'feed' as const, value: pet.hunger, label: 'feed' },
    { key: 'scratch' as const, value: pet.happiness, label: 'play' },
    { key: 'bathe' as const, value: pet.cleanliness, label: 'bathe' },
  ];
  const lowest = stats.reduce((a, b) => (a.value <= b.value ? a : b));
  if (lowest.value < 40) return `Your cat needs you to ${lowest.label} most right now.`;
  return 'All stats look healthy — any care action helps your streak!';
};

export const useCouplePet = (coupleId: string) => {
  return useQuery<CouplePet | null, Error>({
    queryKey: ['couplePet', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const { data, error } = await supabase.from('couple_pets').select('*').eq('couple_id', coupleId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        const { data: created, error: createErr } = await supabase
          .from('couple_pets')
          .insert({ couple_id: coupleId })
          .select()
          .single();
        if (createErr) throw new Error(createErr.message);
        return created as CouplePet;
      }
      const { pet, changed } = applyPetDecay(data as CouplePet);
      if (changed) {
        await supabase
          .from('couple_pets')
          .update({ hunger: pet.hunger, happiness: pet.happiness, cleanliness: pet.cleanliness })
          .eq('couple_id', coupleId);
      }
      return pet;
    },
    enabled: !!coupleId,
    refetchInterval: 10000,
  });
};

export const usePetCare = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { coupleId: string; userId: string; careType: 'feed' | 'scratch' | 'bathe' }>({
    mutationFn: async ({ coupleId, userId, careType }) => {
      const pet = await supabase.from('couple_pets').select('*').eq('couple_id', coupleId).single();
      if (pet.error) throw new Error(pet.error.message);
      const row = pet.data as CouplePet;
      const now = new Date().toISOString();
      const updates: Partial<CouplePet> & { updated_at: string } = { updated_at: now };
      if (careType === 'feed') {
        updates.hunger = Math.min(100, row.hunger + 25);
        updates.happiness = Math.min(100, row.happiness + 5);
        updates.last_fed_at = now;
      } else if (careType === 'scratch') {
        updates.happiness = Math.min(100, row.happiness + 20);
        updates.last_played_at = now;
      } else {
        updates.cleanliness = Math.min(100, row.cleanliness + 30);
        updates.happiness = Math.min(100, row.happiness + 8);
        updates.last_bathed_at = now;
      }
      const { error } = await supabase.from('couple_pets').update(updates).eq('couple_id', coupleId);
      if (error) throw new Error(error.message);
      await supabase.from('pet_care_logs').insert({ couple_id: coupleId, user_id: userId, care_type: careType });
      try {
        await supabase.rpc('increment_couple_streak', { p_couple_id: coupleId });
      } catch {
        /* streak RPC optional until migration runs */
      }
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['couplePet', v.coupleId] }),
  });
};

export const predictNextCycle = (logs: CycleLog[]): string | null => {
  const sorted = [...logs].filter((l) => l.flow_strength === 'medium' || l.flow_strength === 'heavy').sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
  );
  if (sorted.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(
      (new Date(sorted[i].log_date).getTime() - new Date(sorted[i - 1].log_date).getTime()) / 86400000
    );
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const last = new Date(sorted[sorted.length - 1].log_date);
  last.setDate(last.getDate() + Math.round(avg));
  return last.toISOString().slice(0, 10);
};
