import {
  loadQueue,
  saveQueue,
  enqueueAction,
  removeFromQueue,
  type KeyValueStorage,
  type QueuedAction,
} from "../offlineQueue";

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: async (key) => (key in store ? store[key] : null),
    setItem: async (key, value) => {
      store[key] = value;
    },
  };
}

test("loadQueue returns an empty array when nothing is stored yet", async () => {
  const storage = fakeStorage();

  expect(await loadQueue(storage)).toEqual([]);
});

test("saveQueue then loadQueue round-trips the same data", async () => {
  const storage = fakeStorage();
  const queue: QueuedAction[] = [
    {
      id: "a1",
      queuedAt: "2026-08-07T00:00:00.000Z",
      type: "lanjut",
      tiketId: "tiket-1",
      changedBy: "teknisi-1",
    },
  ];

  await saveQueue(storage, queue);

  expect(await loadQueue(storage)).toEqual(queue);
});

test("loadQueue returns an empty array when the stored value is corrupted JSON", async () => {
  const storage = fakeStorage({ "kristek:offline-queue": "not json" });

  expect(await loadQueue(storage)).toEqual([]);
});

test("enqueueAction appends a new action with a generated id and timestamp", async () => {
  const storage = fakeStorage();

  const result = await enqueueAction(
    storage,
    { type: "pending", tiketId: "tiket-1", changedBy: "teknisi-1", notes: "Menunggu material" },
    new Date("2026-08-07T10:00:00.000Z")
  );

  expect(result).toEqual([
    {
      id: expect.any(String),
      queuedAt: "2026-08-07T10:00:00.000Z",
      type: "pending",
      tiketId: "tiket-1",
      changedBy: "teknisi-1",
      notes: "Menunggu material",
    },
  ]);
  expect(await loadQueue(storage)).toEqual(result);
});

test("removeFromQueue drops only the matching id and persists the change", async () => {
  const storage = fakeStorage();
  await saveQueue(storage, [
    { id: "a1", queuedAt: "2026-08-07T00:00:00.000Z", type: "lanjut", tiketId: "tiket-1", changedBy: "teknisi-1" },
    { id: "a2", queuedAt: "2026-08-07T00:01:00.000Z", type: "lanjut", tiketId: "tiket-2", changedBy: "teknisi-1" },
  ]);

  const result = await removeFromQueue(storage, "a1");

  expect(result).toEqual([
    { id: "a2", queuedAt: "2026-08-07T00:01:00.000Z", type: "lanjut", tiketId: "tiket-2", changedBy: "teknisi-1" },
  ]);
  expect(await loadQueue(storage)).toEqual(result);
});
