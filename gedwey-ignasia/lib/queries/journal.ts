import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { isNetworkError, markOffline, markOnline } from '../networkStatus';
import { enqueueMutation } from '../offlineQueue';
import { broadcastCoupleEvent } from '../notifications';

export interface JournalEntry {
  id: string;
  created_at: string;
  updated_at: string;
  couple_id: string;
  creator_id: string;
  title: string;
  content: string;
  image_url: string | null;
  profiles?: {
    display_name: string | null;
  };
}

// Fetch all journal entries for a couple
export const useJournalEntries = (coupleId: string) => {
  return useQuery<JournalEntry[], Error>({
    queryKey: ['journalEntries', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*, profiles:creator_id(display_name)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return (data || []) as JournalEntry[];
    },
    enabled: !!coupleId,
  });
};

// Fetch a single journal entry by ID
export const useJournalEntry = (entryId: string) => {
  return useQuery<JournalEntry, Error>({
    queryKey: ['journalEntry', entryId],
    queryFn: async () => {
      if (!entryId) throw new Error('Entry ID is required');

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*, profiles:creator_id(display_name)')
        .eq('id', entryId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as JournalEntry;
    },
    enabled: !!entryId,
  });
};

// Create a new journal entry
export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<
    JournalEntry,
    Error,
    { coupleId: string; creatorId: string; title: string; content: string; imageUrl?: string }
  >({
    mutationFn: async ({ coupleId, creatorId, title, content, imageUrl }) => {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            couple_id: coupleId,
            creator_id: creatorId,
            title,
            content,
            image_url: imageUrl || null,
          })
          .select('*, profiles:creator_id(display_name)')
          .single();

        if (error) throw new Error(error.message);

        // Broadcast realtime event to partner
        broadcastCoupleEvent(coupleId, creatorId, 'journal_created', {
          title: 'Shared Scrapbook 📸',
          body: 'Your partner added a new memory to your shared journal!',
        }).catch((err) => console.error('[Journal] Realtime broadcast failed:', err));

        markOnline();
        return data as JournalEntry;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) {
          markOffline();
          await enqueueMutation('journal_entries', 'insert', {
            couple_id: coupleId,
            creator_id: creatorId,
            title,
            content,
            image_url: imageUrl || null,
          });
          return { id: `temp-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), couple_id: coupleId, creator_id: creatorId, title, content, image_url: imageUrl || null } as JournalEntry;
        }
        throw err instanceof Error ? err : new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', data.couple_id] });
    },
  });
};
