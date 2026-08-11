import type { SupabaseClient } from "@supabase/supabase-js";
import { createOfflineQueueStore } from "../offlineQueueStore";
import * as processQueuedActionModule from "../processQueuedAction";
import type { KeyValueStorage } from "../offlineQueue";

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: async (key) => (key in store ? store[key] : null),
    setItem: async (key, value) => {
      store[key] = value;
    },
  };
}

const fakeClient = {} as SupabaseClient;
const fetchPhotoBlob = jest.fn();

afterEach(() => {
  jest.restoreAllMocks();
});

test("hydrate loads the persisted queue into state and notifies subscribers", async () => {
  const storage = fakeStorage({
    "kristek:offline-queue": JSON.stringify([
      { id: "a1", queuedAt: "2026-08-07T00:00:00.000Z", type: "lanjut", tiketId: "tiket-1", changedBy: "teknisi-1" },
    ]),
  });
  const store = createOfflineQueueStore(storage);
  const listener = jest.fn();
  store.subscribe(listener);

  await store.hydrate();

  expect(store.getState().queue).toHaveLength(1);
  expect(listener).toHaveBeenCalled();
});

test("enqueue appends an action, persists it, and updates state", async () => {
  const storage = fakeStorage();
  const store = createOfflineQueueStore(storage);

  await store.enqueue({ type: "lanjut", tiketId: "tiket-1", changedBy: "teknisi-1" });

  expect(store.getState().queue).toHaveLength(1);
  expect(store.getState().queue[0]).toMatchObject({ type: "lanjut", tiketId: "tiket-1" });
});

test("syncNow processes the queue, removing succeeded actions and updating state", async () => {
  jest.spyOn(processQueuedActionModule, "processQueuedAction").mockResolvedValue({ success: true });
  const storage = fakeStorage();
  const store = createOfflineQueueStore(storage);
  await store.enqueue({ type: "lanjut", tiketId: "tiket-1", changedBy: "teknisi-1" });

  await store.syncNow(fakeClient, fetchPhotoBlob);

  expect(store.getState().queue).toEqual([]);
  expect(store.getState().failures).toEqual([]);
  expect(store.getState().isSyncing).toBe(false);
});

test("syncNow keeps failed actions queued and records the failure", async () => {
  jest
    .spyOn(processQueuedActionModule, "processQueuedAction")
    .mockResolvedValue({ success: false, error: "Tiket tidak ditemukan." });
  const storage = fakeStorage();
  const store = createOfflineQueueStore(storage);
  await store.enqueue({ type: "lanjut", tiketId: "tiket-1", changedBy: "teknisi-1" });

  await store.syncNow(fakeClient, fetchPhotoBlob);

  expect(store.getState().queue).toHaveLength(1);
  expect(store.getState().failures).toEqual([
    { action: expect.objectContaining({ tiketId: "tiket-1" }), error: "Tiket tidak ditemukan." },
  ]);
});

test("syncNow ignores a second call while a sync is already in progress", async () => {
  let resolveFirst: (() => void) | undefined;
  let notifyCalled: (() => void) | undefined;
  const calledPromise = new Promise<void>((resolve) => {
    notifyCalled = resolve;
  });
  jest.spyOn(processQueuedActionModule, "processQueuedAction").mockImplementation(() => {
    notifyCalled?.();
    return new Promise((resolve) => {
      resolveFirst = () => resolve({ success: true });
    });
  });
  const storage = fakeStorage();
  const store = createOfflineQueueStore(storage);
  await store.enqueue({ type: "lanjut", tiketId: "tiket-1", changedBy: "teknisi-1" });

  const firstSync = store.syncNow(fakeClient, fetchPhotoBlob);
  expect(store.getState().isSyncing).toBe(true);
  await calledPromise;

  await store.syncNow(fakeClient, fetchPhotoBlob);
  expect(processQueuedActionModule.processQueuedAction).toHaveBeenCalledTimes(1);

  resolveFirst?.();
  await firstSync;
});
