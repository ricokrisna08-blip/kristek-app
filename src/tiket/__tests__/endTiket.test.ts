import type { SupabaseClient } from "@supabase/supabase-js";
import { endTiket } from "../endTiket";

function fakeClient(opts: {
  tiketStatus: string;
  createdBy?: string;
  pemilikIds?: string[];
  upload: jest.Mock;
  insertFoto: jest.Mock;
  updateTiket: jest.Mock;
  insertStatusLog?: jest.Mock;
  insertNotifikasi?: jest.Mock;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { status: opts.tiketStatus, created_by: opts.createdBy ?? "admin-1" },
                  error: null,
                }),
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
      if (table === "users") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: (opts.pemilikIds ?? ["pemilik-1"]).map((id) => ({ id })),
                error: null,
              }),
          }),
        };
      }
      if (table === "notifikasi") {
        const insertNotifikasi = opts.insertNotifikasi ?? jest.fn();
        return {
          insert: (...args: unknown[]) => {
            insertNotifikasi(...args);
            return { select: () => Promise.resolve({ data: [], error: null }) };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        upload: opts.upload,
        getPublicUrl: () => ({ data: { publicUrl: "https://example.test/after.jpg" } }),
      }),
    },
  } as unknown as SupabaseClient;
}

test("End succeeds: uploads after-photo, records tiket_foto, moves Tiket to Selesai, and notifies Admin+Pemilik", async () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const insertFoto = jest.fn().mockResolvedValue({ error: null });
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const insertStatusLog = jest.fn().mockResolvedValue({ error: null });
  const insertNotifikasi = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    createdBy: "admin-1",
    pemilikIds: ["pemilik-1"],
    upload,
    insertFoto,
    updateTiket,
    insertStatusLog,
    insertNotifikasi,
  });

  const result = await endTiket(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: new Blob(["fake"]),
  });

  expect(upload).toHaveBeenCalled();
  expect(insertFoto).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    type: "after",
    url: "https://example.test/after.jpg",
    path: expect.any(String),
    uploaded_by: "teknisi-1",
    latitude: null,
    longitude: null,
  });
  expect(updateTiket).toHaveBeenCalledWith(
    expect.objectContaining({ status: "selesai" }),
    "id",
    "tiket-1"
  );
  expect(insertStatusLog).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    status: "selesai",
    changed_by: "teknisi-1",
    notes: null,
  });
  expect(insertNotifikasi).toHaveBeenCalledWith(
    expect.arrayContaining([
      { user_id: "admin-1", tiket_id: "tiket-1", type: "selesai" },
      { user_id: "pemilik-1", tiket_id: "tiket-1", type: "selesai" },
    ])
  );
  expect(result).toEqual({ success: true });
});

test("End is rejected when the Tiket isn't Dikerjakan, without touching Storage or the DB", async () => {
  const upload = jest.fn();
  const insertFoto = jest.fn();
  const updateTiket = jest.fn();
  const insertNotifikasi = jest.fn();
  const client = fakeClient({
    tiketStatus: "pending",
    upload,
    insertFoto,
    updateTiket,
    insertNotifikasi,
  });

  const result = await endTiket(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    photoBlob: new Blob(["fake"]),
  });

  expect(upload).not.toHaveBeenCalled();
  expect(insertFoto).not.toHaveBeenCalled();
  expect(updateTiket).not.toHaveBeenCalled();
  expect(insertNotifikasi).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Tiket harus berstatus Dikerjakan untuk bisa di-End.",
  });
});
