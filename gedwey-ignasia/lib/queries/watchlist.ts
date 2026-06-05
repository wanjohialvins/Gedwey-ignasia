import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { markOffline, markOnline, isNetworkError } from '../networkStatus';

export type WatchlistItem = {
  id: string;
  created_at: string;
  couple_id: string;
  added_by: string | null;
  title: string;
  category: string; // 'show', 'movie', 'anime', 'other'
  note: string | null;
  link: string | null;
  is_watched: boolean;
};

export const useWatchlist = (coupleId: string) => {
  return useQuery<WatchlistItem[], Error>({
    queryKey: ['watchlist', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];

      const { data, error } = await supabase
        .from('watchlist_recommendations')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      markOnline();
      return (data || []) as WatchlistItem[];
    },
    enabled: !!coupleId,
  });
};

export const useCreateWatchlistItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    WatchlistItem,
    Error,
    {
      coupleId: string;
      userId: string;
      title: string;
      category: string;
      note?: string;
      link?: string;
    }
  >({
    mutationFn: async ({ coupleId, userId, title, category, note, link }) => {
      try {
        const { data, error } = await supabase
          .from('watchlist_recommendations')
          .insert({
            couple_id: coupleId,
            added_by: userId,
            title,
            category,
            note: note || null,
            link: link || null,
            is_watched: false,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        markOnline();
        return data as WatchlistItem;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) markOffline();
        throw err instanceof Error ? err : new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', data.couple_id] });
    },
  });
};

export const useToggleWatchlistItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    WatchlistItem,
    Error,
    {
      itemId: string;
      coupleId: string;
      isWatched: boolean;
    }
  >({
    mutationFn: async ({ itemId, isWatched }) => {
      const { data, error } = await supabase
        .from('watchlist_recommendations')
        .update({ is_watched: isWatched })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as WatchlistItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', data.couple_id] });
    },
  });
};

export const useDeleteWatchlistItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { itemId: string; coupleId: string }>({
    mutationFn: async ({ itemId }) => {
      const { error } = await supabase
        .from('watchlist_recommendations')
        .delete()
        .eq('id', itemId);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.coupleId] });
    },
  });
};
