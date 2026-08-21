import type { SupabaseClient } from "@supabase/supabase-js";
import { createTiketWithAssignment } from "../createTiketWithAssignment";

function fakeClient(handlers: Record<string, any>): SupabaseClient {
  return {
    from: (table: string) => handlers[table],
    functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
  } as unknown as SupabaseClient;
}

function fakeInsertSelectSingle(result: { data: unknown; error: unknown }) {
  return jest.fn().mockReturnValue({
    select: () => ({
      single: () => Promise.resolve(result),
    }),
  });
}

test("Instalasi: creates the Pelanggan first, then the Tiket linked to it", async () => {
  const pelangganInsert = fakeInsertSelectSingle({
    data: {
      id: "pelanggan-1",
      nama: "Budi",
      alamat: "Jl. Melati 1",
      no_hp: "0812",
      nomor_pelanggan: "PLG-000001",
      wilayah_id: "wilayah-1",
      odp_id: "odp-1",
      paket_id: "paket-1",
    },
    error: null,
  });
  const tiketInsert = fakeInsertSelectSingle({
    data: { id: "tiket-1" },
    error: null,
  });
  const tiketTeknisiInsert = jest.fn().mockResolvedValue({ error: null });
  const notifikasiInsert = jest.fn().mockResolvedValue({ error: null });
  const statusLogInsert = jest.fn().mockResolvedValue({ error: null });

  const client = fakeClient({
    pelanggan: { insert: pelangganInsert },
    tiket: { insert: tiketInsert },
    tiket_teknisi: { insert: tiketTeknisiInsert },
    notifikasi: { insert: notifikasiInsert },
    tiket_status_log: { insert: statusLogInsert },
  });

  const result = await createTiketWithAssignment(client, {
    jenis: "instalasi",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    pelangganBaru: {
      nama: "Budi",
      alamat: "Jl. Melati 1",
      noHp: "0812",
      odpId: "odp-1",
      paketId: "paket-1",
    },
  });

  expect(pelangganInsert).toHaveBeenCalledWith({
    nama: "Budi",
    alamat: "Jl. Melati 1",
    no_hp: "0812",
    wilayah_id: "wilayah-1",
    odp_id: "odp-1",
    paket_id: "paket-1",
  });
  expect(tiketInsert).toHaveBeenCalledWith({
    jenis: "instalasi",
    wilayah_id: "wilayah-1",
    created_by: "admin-1",
    status: "ditugaskan",
    pelanggan_id: "pelanggan-1",
  });
  expect(statusLogInsert).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    status: "ditugaskan",
    changed_by: "admin-1",
    notes: null,
  });
  expect(result).toEqual({ success: true, tiketId: "tiket-1" });
});

test("Gangguan-Komplain: uses an existing Pelanggan and records the Keluhan", async () => {
  const tiketInsert = fakeInsertSelectSingle({
    data: { id: "tiket-2" },
    error: null,
  });
  const tiketTeknisiInsert = jest.fn().mockResolvedValue({ error: null });
  const notifikasiInsert = jest.fn().mockResolvedValue({ error: null });
  const statusLogInsert = jest.fn().mockResolvedValue({ error: null });

  const client = fakeClient({
    tiket: { insert: tiketInsert },
    tiket_teknisi: { insert: tiketTeknisiInsert },
    notifikasi: { insert: notifikasiInsert },
    tiket_status_log: { insert: statusLogInsert },
  });

  const result = await createTiketWithAssignment(client, {
    jenis: "gangguan_komplain",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    pelangganId: "pelanggan-9",
    keluhan: "Internet putus sejak semalam",
  });

  expect(tiketInsert).toHaveBeenCalledWith({
    jenis: "gangguan_komplain",
    wilayah_id: "wilayah-1",
    created_by: "admin-1",
    status: "ditugaskan",
    pelanggan_id: "pelanggan-9",
    keluhan: "Internet putus sejak semalam",
  });
  expect(statusLogInsert).toHaveBeenCalledWith({
    tiket_id: "tiket-2",
    status: "ditugaskan",
    changed_by: "admin-1",
    notes: null,
  });
  expect(result).toEqual({ success: true, tiketId: "tiket-2" });
});

test("Maintenance: uses an ODP instead of a Pelanggan and records Deskripsi Pekerjaan", async () => {
  const tiketInsert = fakeInsertSelectSingle({
    data: { id: "tiket-3" },
    error: null,
  });
  const tiketTeknisiInsert = jest.fn().mockResolvedValue({ error: null });
  const notifikasiInsert = jest.fn().mockResolvedValue({ error: null });
  const statusLogInsert = jest.fn().mockResolvedValue({ error: null });

  const client = fakeClient({
    tiket: { insert: tiketInsert },
    tiket_teknisi: { insert: tiketTeknisiInsert },
    notifikasi: { insert: notifikasiInsert },
    tiket_status_log: { insert: statusLogInsert },
  });

  const result = await createTiketWithAssignment(client, {
    jenis: "maintenance",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    odpId: "odp-5",
    deskripsiPekerjaan: "Migrasi kabel ke ODC baru",
  });

  expect(tiketInsert).toHaveBeenCalledWith({
    jenis: "maintenance",
    wilayah_id: "wilayah-1",
    created_by: "admin-1",
    status: "ditugaskan",
    odp_id: "odp-5",
    deskripsi_pekerjaan: "Migrasi kabel ke ODC baru",
  });
  expect(statusLogInsert).toHaveBeenCalledWith({
    tiket_id: "tiket-3",
    status: "ditugaskan",
    changed_by: "admin-1",
    notes: null,
  });
  expect(result).toEqual({ success: true, tiketId: "tiket-3" });
});

test("Instalasi: a Pelanggan creation failure stops before creating the Tiket", async () => {
  const pelangganInsert = fakeInsertSelectSingle({
    data: null,
    error: { message: "insert failed" },
  });
  const tiketInsert = jest.fn();

  const client = fakeClient({
    pelanggan: { insert: pelangganInsert },
    tiket: { insert: tiketInsert },
  });

  const result = await createTiketWithAssignment(client, {
    jenis: "instalasi",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    pelangganBaru: {
      nama: "Budi",
      alamat: "Jl. Melati 1",
      noHp: "0812",
      odpId: "odp-1",
      paketId: "paket-1",
    },
  });

  expect(tiketInsert).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Gagal menambah Pelanggan. Coba lagi.",
  });
});

test("a Tiket insert failure stops before assigning Teknisi or notifying", async () => {
  const tiketInsert = fakeInsertSelectSingle({
    data: null,
    error: { message: "insert failed" },
  });
  const tiketTeknisiInsert = jest.fn();
  const notifikasiInsert = jest.fn();

  const client = fakeClient({
    tiket: { insert: tiketInsert },
    tiket_teknisi: { insert: tiketTeknisiInsert },
    notifikasi: { insert: notifikasiInsert },
  });

  const result = await createTiketWithAssignment(client, {
    jenis: "gangguan_komplain",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    pelangganId: "pelanggan-9",
    keluhan: "Internet lambat",
  });

  expect(tiketTeknisiInsert).not.toHaveBeenCalled();
  expect(notifikasiInsert).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Gagal membuat Tiket. Coba lagi.",
  });
});
