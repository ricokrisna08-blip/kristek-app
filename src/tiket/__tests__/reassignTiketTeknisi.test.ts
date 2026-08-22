import type { SupabaseClient } from "@supabase/supabase-js";
import { reassignTiketTeknisi } from "../reassignTiketTeknisi";

function fakeClient(opts: {
  tiketStatus: string;
  existingTeknisiIds?: string[];
  teknisiUsers?: { id: string; nama: string }[];
  deleteTeknisi?: jest.Mock;
  insertTeknisi?: jest.Mock;
  insertNotifikasi?: jest.Mock;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { status: opts.tiketStatus }, error: null }),
            }),
          }),
        };
      }
      if (table === "tiket_teknisi") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: (opts.existingTeknisiIds ?? []).map((id) => ({ teknisi_id: id })),
                error: null,
              }),
          }),
          delete: () => ({
            eq: (...args: unknown[]) => {
              (opts.deleteTeknisi ?? jest.fn())(...args);
              return Promise.resolve({ error: null });
            },
          }),
          insert: opts.insertTeknisi ?? jest.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "users") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: opts.teknisiUsers ?? [], error: null }),
          }),
        };
      }
      if (table === "notifikasi") {
        const insertNotifikasi = opts.insertNotifikasi ?? jest.fn();
        return {
          insert: (...args: unknown[]) => {
            insertNotifikasi(...args);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
  } as unknown as SupabaseClient;
}

test("replaces the Teknisi assignment and notifies only the newly added Teknisi", async () => {
  const deleteTeknisi = jest.fn().mockResolvedValue({ error: null });
  const insertTeknisi = jest.fn().mockResolvedValue({ error: null });
  const insertNotifikasi = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "ditugaskan",
    existingTeknisiIds: ["teknisi-1"],
    teknisiUsers: [
      { id: "teknisi-1", nama: "Ahmad Wahyudi" },
      { id: "teknisi-2", nama: "Roby Agung" },
    ],
    deleteTeknisi,
    insertTeknisi,
    insertNotifikasi,
  });

  const result = await reassignTiketTeknisi(client, {
    tiketId: "tiket-1",
    teknisiIds: ["teknisi-1", "teknisi-2"],
  });

  expect(deleteTeknisi).toHaveBeenCalledWith("tiket_id", "tiket-1");
  expect(insertTeknisi).toHaveBeenCalledWith([
    { tiket_id: "tiket-1", teknisi_id: "teknisi-1", teknisi_nama_snapshot: "Ahmad Wahyudi" },
    { tiket_id: "tiket-1", teknisi_id: "teknisi-2", teknisi_nama_snapshot: "Roby Agung" },
  ]);
  // teknisi-1 sudah ada sebelumnya -- cuma teknisi-2 (baru) yang dapat notif.
  expect(insertNotifikasi).toHaveBeenCalledWith([
    { id: expect.any(String), user_id: "teknisi-2", tiket_id: "tiket-1", type: "ditugaskan" },
  ]);
  expect(result).toEqual({ success: true });
});

test("rejects when the Tiket is no longer Ditugaskan (already Started)", async () => {
  const deleteTeknisi = jest.fn();
  const client = fakeClient({ tiketStatus: "dikerjakan", deleteTeknisi });

  const result = await reassignTiketTeknisi(client, {
    tiketId: "tiket-1",
    teknisiIds: ["teknisi-2"],
  });

  expect(deleteTeknisi).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error:
      "Teknisi cuma bisa diganti selagi Tiket masih berstatus Ditugaskan (belum di-Start).",
  });
});

test("rejects an empty Teknisi list without touching the database", async () => {
  const deleteTeknisi = jest.fn();
  const client = fakeClient({ tiketStatus: "ditugaskan", deleteTeknisi });

  const result = await reassignTiketTeknisi(client, { tiketId: "tiket-1", teknisiIds: [] });

  expect(deleteTeknisi).not.toHaveBeenCalled();
  expect(result).toEqual({ success: false, error: "Pilih minimal satu Teknisi." });
});

test("sends no notification when the resulting assignment has no newly added Teknisi", async () => {
  const insertNotifikasi = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "ditugaskan",
    existingTeknisiIds: ["teknisi-1", "teknisi-2"],
    teknisiUsers: [{ id: "teknisi-1", nama: "Ahmad Wahyudi" }],
    insertNotifikasi,
  });

  const result = await reassignTiketTeknisi(client, {
    tiketId: "tiket-1",
    teknisiIds: ["teknisi-1"],
  });

  expect(insertNotifikasi).not.toHaveBeenCalled();
  expect(result).toEqual({ success: true });
});
