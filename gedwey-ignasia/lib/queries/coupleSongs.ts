import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { markOffline, markOnline, isNetworkError } from '../networkStatus';

export type CoupleSong = {
  id: string;
  created_at: string;
  couple_id: string;
  added_by: string | null;
  title: string;
  artist: string | null;
  embed_url: string | null;
  mood_tag: string | null;
  is_song_of_week: boolean;
};

export const useCoupleSongs = (coupleId: string) => {
  return useQuery<CoupleSong[], Error>({
    queryKey: ['coupleSongs', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];

      const { data, error } = await supabase
        .from('couple_songs')
        .select('*')
        .eq('couple_id', coupleId)
        .order('is_song_of_week', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      markOnline();
      return (data || []) as CoupleSong[];
    },
    enabled: !!coupleId,
  });
};

export const useCreateCoupleSong = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CoupleSong,
    Error,
    {
      coupleId: string;
      userId: string;
      title: string;
      artist?: string;
      embedUrl?: string;
      moodTag?: string;
      isSongOfWeek?: boolean;
    }
  >({
    mutationFn: async ({ coupleId, userId, title, artist, embedUrl, moodTag, isSongOfWeek }) => {
      try {
        if (isSongOfWeek) {
          await supabase
            .from('couple_songs')
            .update({ is_song_of_week: false })
            .eq('couple_id', coupleId);
        }

        const { data, error } = await supabase
          .from('couple_songs')
          .insert({
            couple_id: coupleId,
            added_by: userId,
            title,
            artist: artist || null,
            embed_url: embedUrl || null,
            mood_tag: moodTag || null,
            is_song_of_week: !!isSongOfWeek,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        markOnline();
        return data as CoupleSong;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) markOffline();
        throw err instanceof Error ? err : new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupleSongs', data.couple_id] });
    },
  });
};

export const useDeleteCoupleSong = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { songId: string; coupleId: string }>({
    mutationFn: async ({ songId }) => {
      const { error } = await supabase.from('couple_songs').delete().eq('id', songId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coupleSongs', variables.coupleId] });
    },
  });
};
