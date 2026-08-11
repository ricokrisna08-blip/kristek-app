import { useSyncExternalStore } from "react";
import { offlineQueueStore } from "./offlineQueueStore.instance";
import type { OfflineQueueState } from "./offlineQueueStore";

export function useOfflineQueue(): OfflineQueueState {
  return useSyncExternalStore(offlineQueueStore.subscribe, offlineQueueStore.getState);
}
