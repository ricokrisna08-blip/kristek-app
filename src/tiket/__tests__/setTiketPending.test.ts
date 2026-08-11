import type { SupabaseClient } from "@supabase/supabase-js";
import { setTiketPending } from "../setTiketPending";

function fakeClient(opts: {
  tiketStatus: string;
  createdBy?: string;
  pemilikIds?: string[];
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
        return { insert: opts.insertNotifikasi ?? jest.fn().mockResolvedValue({ error: null }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("Pending succeeds: moves Tiket to Pending and notifies the assigning Admin and all Pemilik", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const insertStatusLog = jest.fn().mockResolvedValue({ error: null });
  const insertNotifikasi = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    createdBy: "admin-1",
    pemilikIds: ["pemilik-1"],
    updateTiket,
    insertStatusLog,
    insertNotifikasi,
  });

  const result = await setTiketPending(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
    notes: "Menunggu material dari gudang",
  });

  expect(updateTiket).toHaveBeenCalledWith(
    expect.objectContaining({ status: "pending" }),
    "id",
    "tiket-1"
  );
  expect(insertStatusLog).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    status: "pending",
    changed_by: "teknisi-1",
    notes: "Menunggu material dari gudang",
  });
  expect(insertNotifikasi).toHaveBeenCalledWith(
    expect.arrayContaining([
      {
        user_id: "admin-1",
        tiket_id: "tiket-1",
        type: "pending",
        notes: "Menunggu material dari gudang",
      },
      {
        user_id: "pemilik-1",
        tiket_id: "tiket-1",
        type: "pending",
        notes: "Menunggu material dari gudang",
      },
    ])
  );
  expect(result).toEqual({ success: true });
});

test("Pending is rejected without notes, without touching the DB", async () => {
  const updateTiket = jest.fn();
  const insertNotifikasi = jest.fn();
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    updateTiket,
    insertNotifikasi,
  });

  const result = await setTiketPending(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
    notes: "   ",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(insertNotifikasi).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Catatan wajib diisi saat menandai Tiket Pending.",
  });
});

test("Pending is rejected when the Tiket isn't Dikerjakan", async () => {
  const updateTiket = jest.fn();
  const client = fakeClient({ tiketStatus: "ditugaskan", updateTiket });

  const result = await setTiketPending(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
    notes: "Menunggu material",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Tiket harus berstatus Dikerjakan untuk bisa ditandai Pending.",
  });
});
