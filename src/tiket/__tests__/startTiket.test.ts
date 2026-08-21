import type { SupabaseClient } from "@supabase/supabase-js";
import { startTiket } from "../startTiket";

function fakeClient(opts: {
  tiketStatus: string;
  upload: jest.Mock;
  insertFoto: jest.Mock;
  updateTiket: jest.Mock;
  insertStatusLog?: jest.Mock;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { status: opts.tiketStatus }, error: null }),
            }),
          }),
          update: (payload: unknown) => ({
            eq: (...args: unknown[]) => opts.updateTiket(payload, ...args),
          }),
        };
      }
      if (table === "tiket_foto") {
        return { insert: opts.insertFoto };
      }
      if (table === "tiket_status_log") {
        return { insert: opts.insertStatusLog ?? jest.fn().mockResolvedValue({ error: null }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        upload: opts.upload,
        getPublicUrl: () => ({ data: { publicUrl: "https://example.test/before.jpg" } }),
      }),
    },
  } as unknown as SupabaseClient;
}

test("Start succeeds: uploads photo, records tiket_foto, and moves Tiket to Dikerjakan", async () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const insertFoto = jest.fn().mockResolvedValue({ error: null });
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const insertStatusLog = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "ditugaskan",
    upload,
    insertFoto,
    updateTiket,
    insertStatusLog,
  });

  const result = await startTiket(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: new Blob(["fake"]),
  });

  expect(upload).toHaveBeenCalled();
  expect(insertFoto).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    type: "before",
    url: "https://example.test/before.jpg",
    path: expect.any(String),
    uploaded_by: "teknisi-1",
    latitude: null,
    longitude: null,
  });
  expect(updateTiket).toHaveBeenCalledWith(
    expect.objectContaining({ status: "dikerjakan" }),
    "id",
    "tiket-1"
  );
  expect(insertStatusLog).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    status: "dikerjakan",
    changed_by: "teknisi-1",
    notes: null,
  });
  expect(result).toEqual({ success: true });
});

test("Start records the GPS coordinates when provided", async () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const insertFoto = jest.fn().mockResolvedValue({ error: null });
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({ tiketStatus: "ditugaskan", upload, insertFoto, updateTiket });

  await startTiket(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: new Blob(["fake"]),
    latitude: -6.2,
    longitude: 106.8,
  });

  expect(insertFoto).toHaveBeenCalledWith(
    expect.objectContaining({ latitude: -6.2, longitude: 106.8 })
  );
});

test("Start is rejected when the Tiket isn't Ditugaskan, without touching Storage or the DB", async () => {
  const upload = jest.fn();
  const insertFoto = jest.fn();
  const updateTiket = jest.fn();
  const client = fakeClient({ tiketStatus: "dikerjakan", upload, insertFoto, updateTiket });

  const result = await startTiket(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: new Blob(["fake"]),
  });

  expect(upload).not.toHaveBeenCalled();
  expect(insertFoto).not.toHaveBeenCalled();
  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Tiket harus berstatus Ditugaskan untuk bisa di-Start.",
  });
});
