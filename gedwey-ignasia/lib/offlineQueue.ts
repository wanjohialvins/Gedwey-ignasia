import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { isNetworkError, markOffline, markOnline } from './networkStatus';

export interface PendingMutation {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete' | 'upsert';
  data: any;
}

const QUEUE_STORAGE_KEY = '@gedwey/offline_mutations';

export async function getOfflineQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveOfflineQueue(queue: PendingMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export async function enqueueMutation(
  table: string,
  action: 'insert' | 'update' | 'delete' | 'upsert',
  data: any
): Promise<void> {
  const queue = await getOfflineQueue();
  const newOp: PendingMutation = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    table,
    action,
    data,
  };
  queue.push(newOp);
  await saveOfflineQueue(queue);
  console.log(`[OfflineQueue] Enqueued operation for ${table}:`, newOp);
}

export async function syncOfflineQueue(): Promise<boolean> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return true;

  console.log(`[OfflineQueue] Attempting to sync ${queue.length} pending mutations...`);
  const remaining: PendingMutation[] = [];

  for (const op of queue) {
    try {
      let error: any = null;
      if (op.action === 'insert') {
        const { error: err } = await supabase.from(op.table).insert(op.data);
        error = err;
      } else if (op.action === 'update') {
        const { id, ...fields } = op.data;
        const { error: err } = await supabase.from(op.table).update(fields).eq('id', id);
        error = err;
      } else if (op.action === 'upsert') {
        const { error: err } = await supabase.from(op.table).upsert(op.data);
        error = err;
      } else if (op.action === 'delete') {
        const { error: err } = await supabase.from(op.table).delete().eq('id', op.data.id);
        error = err;
      }

      if (error) {
        console.error(`[OfflineQueue] Error syncing operation on ${op.table}:`, error);
        throw error;
      }
      console.log(`[OfflineQueue] Synced successfully: ${op.table} (${op.action})`);
    } catch (err: any) {
      const message = err?.message || String(err);
      if (isNetworkError(message)) {
        console.log(`[OfflineQueue] Network error during sync. Retaining operations.`);
        markOffline();
        // Keep this and all subsequent operations
        const index = queue.indexOf(op);
        await saveOfflineQueue(queue.slice(index));
        return false;
      }
      // If it's a validation/foreign key/RSL/policy error, we discard it to prevent blocking the queue
      console.log(`[OfflineQueue] Discarding invalid operation:`, err);
    }
  }

  await saveOfflineQueue([]);
  markOnline();
  console.log(`[OfflineQueue] Sync completed successfully.`);
  return true;
}
