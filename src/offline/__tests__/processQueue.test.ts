import type { SupabaseClient } from "@supabase/supabase-js";
import { processQueue } from "../processQueue";
import * as processQueuedActionModule from "../processQueuedAction";
import type { QueuedAction } from "../offlineQueue";

const fakeClient = {} as SupabaseClient;
const fetchPhotoBlob = jest.fn();

const actionA: QueuedAction = {
  id: "a1",
  queuedAt: "2026-08-07T00:00:00.000Z",
  type: "lanjut",
  tiketId: "tiket-1",
  changedBy: "teknisi-1",
};
const actionB: QueuedAction = {
  id: "a2",
  queuedAt: "2026-08-07T00:01:00.000Z",
  type: "lanjut",
  tiketId: "tiket-2",
  changedBy: "teknisi-1",
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("processes queued actions in order and clears the queue when all succeed", async () => {
  const spy = jest
    .spyOn(processQueuedActionModule, "processQueuedAction")
    .mockResolvedValue({ success: true });

  const result = await processQueue(fakeClient, [actionA, actionB], fetchPhotoBlob);

  expect(spy.mock.calls[0][1]).toBe(actionA);
  expect(spy.mock.calls[1][1]).toBe(actionB);
  expect(result).toEqual({ remainingQueue: [], failures: [] });
});

test("keeps failed actions in the queue and reports why, without abandoning the rest", async () => {
  jest
    .spyOn(processQueuedActionModule, "processQueuedAction")
    .mockResolvedValueOnce({ success: false, error: "Tiket tidak ditemukan." })
    .mockResolvedValueOnce({ success: true });

  const result = await processQueue(fakeClient, [actionA, actionB], fetchPhotoBlob);

  expect(result).toEqual({
    remainingQueue: [actionA],
    failures: [{ action: actionA, error: "Tiket tidak ditemukan." }],
  });
});

test("processes an empty queue without error", async () => {
  const result = await processQueue(fakeClient, [], fetchPhotoBlob);

  expect(result).toEqual({ remainingQueue: [], failures: [] });
});
