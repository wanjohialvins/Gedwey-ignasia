import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { CACHE_KEYS, getCache, setCache } from '../offlineCache';
import { isNetworkError, markOffline, markOnline } from '../networkStatus';

export type ActivityLog = {
  id: string;
  created_at: string;
  couple_id: string;
  user_id: string | null;
  activity_type: string;
  title: string;
  metadata: Record<string, unknown> | null;
  profiles?: { display_name: string | null } | null;
};

export type SharedItem = {
  id: string;
  created_at: string;
  updated_at: string;
  couple_id: string;
  creator_id: string | null;
  item_type: 'todo' | 'bucket';
  title: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
};

export const useActivityLogs = (coupleId: string, activityType?: string) => {
  return useQuery<ActivityLog[], Error>({
    queryKey: ['activityLogs', coupleId, activityType],
    queryFn: async () => {
      if (!coupleId) return [];
      let query = supabase
        .from('activity_logs')
        .select('*, profiles(display_name)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(80);

      if (activityType && activityType !== 'all') {
        query = query.eq('activity_type', activityType);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as ActivityLog[];
    },
    enabled: !!coupleId,
  });
};

export const useLogActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { coupleId: string; userId?: string; activityType: string; title: string; metadata?: Record<string, unknown> }>({
    mutationFn: async ({ coupleId, userId, activityType, title, metadata }) => {
      try {
        const { error } = await supabase.from('activity_logs').insert({
          couple_id: coupleId,
          user_id: userId,
          activity_type: activityType,
          title,
          metadata: metadata || {},
        });
        if (error) throw new Error(error.message);
        markOnline();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) {
          markOffline();
          return;
        }
        throw err instanceof Error ? err : new Error(message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activityLogs', variables.coupleId] });
    },
  });
};

export const useSharedItems = (coupleId: string, itemType: 'todo' | 'bucket') => {
  return useQuery<SharedItem[], Error>({
    queryKey: ['sharedItems', coupleId, itemType],
    queryFn: async () => {
      if (!coupleId) return [];
      try {
        const { data, error } = await supabase
          .from('shared_items')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('item_type', itemType)
          .order('completed', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        const items = (data || []) as SharedItem[];
        await setCache(CACHE_KEYS.sharedItems(coupleId, itemType), items);
        markOnline();
        return items;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isNetworkError(message)) markOffline();
        const cached = await getCache<SharedItem[]>(CACHE_KEYS.sharedItems(coupleId, itemType));
        if (cached) return cached;
        throw err instanceof Error ? err : new Error(message);
      }
    },
    enabled: !!coupleId,
  });
};

export const useCreateSharedItem = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedItem, Error, { coupleId: string; userId: string; itemType: 'todo' | 'bucket'; title: string; notes?: string }>({
    mutationFn: async ({ coupleId, userId, itemType, title, notes }) => {
      const { data, error } = await supabase
        .from('shared_items')
        .insert({ couple_id: coupleId, creator_id: userId, item_type: itemType, title, notes })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as SharedItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sharedItems', data.couple_id, data.item_type] });
    },
  });
};

export const useToggleSharedItem = () => {
  const queryClient = useQueryClient();

  return useMutation<SharedItem, Error, SharedItem>({
    mutationFn: async (item) => {
      const completed = !item.completed;
      const { data, error } = await supabase
        .from('shared_items')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', item.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as SharedItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sharedItems', data.couple_id, data.item_type] });
    },
  });
};
