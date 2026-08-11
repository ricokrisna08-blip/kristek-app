export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type QueuedAction =
  | { id: string; queuedAt: string; type: "start"; tiketId: string; uploadedBy: string; photoUri: string }
  | { id: string; queuedAt: string; type: "pending"; tiketId: string; changedBy: string; notes: string }
  | { id: string; queuedAt: string; type: "lanjut"; tiketId: string; changedBy: string }
  | { id: string; queuedAt: string; type: "end"; tiketId: string; uploadedBy: string; photoUri: string };

// Omit<Union, K> collapses the union into its shared keys instead of
// applying per-variant -- this distributes it manually so callers still get
// the correct discriminated-union shape minus id/queuedAt.
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type NewQueuedAction = DistributiveOmit<QueuedAction, "id" | "queuedAt">;

const STORAGE_KEY = "kristek:offline-queue";

export async function loadQueue(storage: KeyValueStorage): Promise<QueuedAction[]> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

export async function saveQueue(
  storage: KeyValueStorage,
  queue: QueuedAction[]
): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function enqueueAction(
  storage: KeyValueStorage,
  action: NewQueuedAction,
  now: Date = new Date()
): Promise<QueuedAction[]> {
  const queue = await loadQueue(storage);
  const newAction = {
    ...action,
    id: `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    queuedAt: now.toISOString(),
  } as QueuedAction;

  const updated = [...queue, newAction];
  await saveQueue(storage, updated);
  return updated;
}

export async function removeFromQueue(
  storage: KeyValueStorage,
  id: string
): Promise<QueuedAction[]> {
  const queue = await loadQueue(storage);
  const updated = queue.filter((action) => action.id !== id);
  await saveQueue(storage, updated);
  return updated;
}
