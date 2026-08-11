import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadQueue,
  saveQueue,
  enqueueAction,
  type KeyValueStorage,
  type QueuedAction,
  type NewQueuedAction,
} from "./offlineQueue";
import { processQueue } from "./processQueue";

export type OfflineQueueState = {
  queue: QueuedAction[];
  failures: { action: QueuedAction; error: string }[];
  isSyncing: boolean;
};

export type OfflineQueueStore = {
  getState: () => OfflineQueueState;
  subscribe: (listener: () => void) => () => void;
  hydrate: () => Promise<void>;
  enqueue: (action: NewQueuedAction) => Promise<void>;
  syncNow: (
    client: SupabaseClient,
    fetchPhotoBlob: (uri: string) => Promise<Blob>
  ) => Promise<void>;
};

export function createOfflineQueueStore(storage: KeyValueStorage): OfflineQueueStore {
  let state: OfflineQueueState = { queue: [], failures: [], isSyncing: false };
  const listeners = new Set<() => void>();

  function setState(partial: Partial<OfflineQueueState>) {
    state = { ...state, ...partial };
    listeners.forEach((listener) => listener());
  }

  return {
    getState: () => state,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    hydrate: async () => {
      const queue = await loadQueue(storage);
      setState({ queue });
    },

    enqueue: async (action) => {
      const queue = await enqueueAction(storage, action);
      setState({ queue });
    },

    syncNow: async (client, fetchPhotoBlob) => {
      if (state.isSyncing) return;
      setState({ isSyncing: true });

      const currentQueue = await loadQueue(storage);
      const { remainingQueue, failures } = await processQueue(
        client,
        currentQueue,
        fetchPhotoBlob
      );
      await saveQueue(storage, remainingQueue);

      setState({ queue: remainingQueue, failures, isSyncing: false });
    },
  };
}
