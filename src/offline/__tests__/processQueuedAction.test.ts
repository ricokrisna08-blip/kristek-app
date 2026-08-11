import type { SupabaseClient } from "@supabase/supabase-js";
import { processQueuedAction } from "../processQueuedAction";
import * as startTiketModule from "../../tiket/startTiket";
import * as setTiketPendingModule from "../../tiket/setTiketPending";
import * as resumeTiketFromPendingModule from "../../tiket/resumeTiketFromPending";
import * as endTiketModule from "../../tiket/endTiket";

const fakeClient = {} as SupabaseClient;
const fakeBlob = new Blob(["fake"]);
const fetchPhotoBlob = jest.fn().mockResolvedValue(fakeBlob);

afterEach(() => {
  jest.restoreAllMocks();
  fetchPhotoBlob.mockClear();
});

test("replays a queued 'start' action through startTiket, fetching its photo by URI", async () => {
  const spy = jest
    .spyOn(startTiketModule, "startTiket")
    .mockResolvedValue({ success: true });

  const result = await processQueuedAction(
    fakeClient,
    {
      id: "a1",
      queuedAt: "2026-08-07T00:00:00.000Z",
      type: "start",
      tiketId: "tiket-1",
      uploadedBy: "teknisi-1",
      photoUri: "file:///local/before.jpg",
    },
    fetchPhotoBlob
  );

  expect(fetchPhotoBlob).toHaveBeenCalledWith("file:///local/before.jpg");
  expect(spy).toHaveBeenCalledWith(fakeClient, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: fakeBlob,
  });
  expect(result).toEqual({ success: true });
});

test("replays a queued 'pending' action through setTiketPending", async () => {
  const spy = jest
    .spyOn(setTiketPendingModule, "setTiketPending")
    .mockResolvedValue({ success: true });

  const result = await processQueuedAction(
    fakeClient,
    {
      id: "a1",
      queuedAt: "2026-08-07T00:00:00.000Z",
      type: "pending",
      tiketId: "tiket-1",
      changedBy: "teknisi-1",
      notes: "Menunggu material",
    },
    fetchPhotoBlob
  );

  expect(spy).toHaveBeenCalledWith(fakeClient, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
    notes: "Menunggu material",
  });
  expect(result).toEqual({ success: true });
});

test("replays a queued 'lanjut' action through resumeTiketFromPending", async () => {
  const spy = jest
    .spyOn(resumeTiketFromPendingModule, "resumeTiketFromPending")
    .mockResolvedValue({ success: true });

  const result = await processQueuedAction(
    fakeClient,
    {
      id: "a1",
      queuedAt: "2026-08-07T00:00:00.000Z",
      type: "lanjut",
      tiketId: "tiket-1",
      changedBy: "teknisi-1",
    },
    fetchPhotoBlob
  );

  expect(spy).toHaveBeenCalledWith(fakeClient, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });
  expect(result).toEqual({ success: true });
});

test("replays a queued 'end' action through endTiket, fetching its photo by URI", async () => {
  const spy = jest.spyOn(endTiketModule, "endTiket").mockResolvedValue({ success: true });

  const result = await processQueuedAction(
    fakeClient,
    {
      id: "a1",
      queuedAt: "2026-08-07T00:00:00.000Z",
      type: "end",
      tiketId: "tiket-1",
      uploadedBy: "teknisi-1",
      photoUri: "file:///local/after.jpg",
    },
    fetchPhotoBlob
  );

  expect(fetchPhotoBlob).toHaveBeenCalledWith("file:///local/after.jpg");
  expect(spy).toHaveBeenCalledWith(fakeClient, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: fakeBlob,
  });
  expect(result).toEqual({ success: true });
});

test("propagates a state-machine rejection instead of swallowing it", async () => {
  jest.spyOn(resumeTiketFromPendingModule, "resumeTiketFromPending").mockResolvedValue({
    success: false,
    error: "Tiket harus berstatus Pending untuk bisa dilanjutkan.",
  });

  const result = await processQueuedAction(
    fakeClient,
    {
      id: "a1",
      queuedAt: "2026-08-07T00:00:00.000Z",
      type: "lanjut",
      tiketId: "tiket-1",
      changedBy: "teknisi-1",
    },
    fetchPhotoBlob
  );

  expect(result).toEqual({
    success: false,
    error: "Tiket harus berstatus Pending untuk bisa dilanjutkan.",
  });
});
