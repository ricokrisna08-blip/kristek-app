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
    paket: {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { harga: 200000 }, error: null }),
        }),
      }),
    },
    pelanggan: { insert: pelangganInsert },
    tiket: { insert: tiketInsert },
    tiket_teknisi: { insert: tiketTeknisiInsert },
    notifikasi: { insert: notifikasiInsert },
    tiket_status_log: { insert: statusLogInsert },
    users: {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ id: "teknisi-1", nama: "Teknisi Satu" }],
            error: null,
          }),
      }),
    },
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
      mikrotikUsername: "budi01",
      tanggalInstalasi: "2026-08-20",
    },
  });

  expect(pelangganInsert).toHaveBeenCalledWith({
    nama: "Budi",
    alamat: "Jl. Melati 1",
    no_hp: "0812",
    wilayah_id: "wilayah-1",
    odp_id: "odp-1",
    paket_id: "paket-1",
    harga: 200000,
    tanggal_instalasi: "2026-08-20",
    tagihan_prorata: 90323,
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
  expect(tiketTeknisiInsert).toHaveBeenCalledWith([
    { tiket_id: "tiket-1", teknisi_id: "teknisi-1", teknisi_nama_snapshot: "Teknisi Satu" },
  ]);
  expect(result).toEqual({ success: true, tiketId: "tiket-1", mikrotikWarning: null });
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
    users: {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ id: "teknisi-1", nama: "Teknisi Satu" }],
            error: null,
          }),
      }),
    },
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
  expect(result).toEqual({ success: true, tiketId: "tiket-2", mikrotikWarning: null });
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
    users: {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ id: "teknisi-1", nama: "Teknisi Satu" }],
            error: null,
          }),
      }),
    },
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
  expect(result).toEqual({ success: true, tiketId: "tiket-3", mikrotikWarning: null });
});

test("Instalasi: Username Mikrotik yang diisi langsung dipakai untuk buat secret Mikrotik", async () => {
  const pelangganInsert = fakeInsertSelectSingle({
    data: {
      id: "pelanggan-4",
      nama: "Sari",
      alamat: "Jl. Kenanga 2",
      no_hp: "0813",
      nomor_pelanggan: "PLG-000004",
      wilayah_id: "wilayah-1",
      odp_id: "odp-1",
      paket_id: "paket-1",
    },
    error: null,
  });
  const tiketInsert = fakeInsertSelectSingle({
    data: { id: "tiket-4" },
    error: null,
  });
  const invoke = jest.fn().mockResolvedValue({ data: { linked: false, renamedFrom: null }, error: null });

  const client = {
    from: (table: string) =>
      ({
        paket: {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { harga: 200000 }, error: null }),
            }),
          }),
        },
        pelanggan: { insert: pelangganInsert },
        tiket: { insert: tiketInsert },
        tiket_teknisi: { insert: jest.fn().mockResolvedValue({ error: null }) },
        notifikasi: { insert: jest.fn().mockResolvedValue({ error: null }) },
        tiket_status_log: { insert: jest.fn().mockResolvedValue({ error: null }) },
        users: {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [{ id: "teknisi-1", nama: "Teknisi Satu" }],
                error: null,
              }),
          }),
        },
      })[table],
    functions: { invoke },
  } as unknown as SupabaseClient;

  const result = await createTiketWithAssignment(client, {
    jenis: "instalasi",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    pelangganBaru: {
      nama: "Sari",
      alamat: "Jl. Kenanga 2",
      noHp: "0813",
      odpId: "odp-1",
      paketId: "paket-1",
      mikrotikUsername: "sari01",
      tanggalInstalasi: "2026-08-20",
    },
  });

  expect(invoke).toHaveBeenCalledWith("mikrotik-create-secret", {
    body: { pelangganId: "pelanggan-4", mikrotikUsername: "sari01" },
  });
  expect(result).toEqual({ success: true, tiketId: "tiket-4", mikrotikWarning: null });
});

test("Instalasi: kegagalan set Username Mikrotik tidak menggagalkan pembuatan Tiket, cuma bawa warning", async () => {
  const pelangganInsert = fakeInsertSelectSingle({
    data: {
      id: "pelanggan-5",
      nama: "Dedi",
      alamat: "Jl. Anggrek 3",
      no_hp: "0814",
      nomor_pelanggan: "PLG-000005",
      wilayah_id: "wilayah-1",
      odp_id: "odp-1",
      paket_id: "paket-1",
    },
    error: null,
  });
  const tiketInsert = fakeInsertSelectSingle({
    data: { id: "tiket-5" },
    error: null,
  });
  const invoke = jest.fn().mockResolvedValue({
    data: null,
    error: { message: "gagal konek ke Mikrotik" },
  });

  const client = {
    from: (table: string) =>
      ({
        paket: {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { harga: 200000 }, error: null }),
            }),
          }),
        },
        pelanggan: { insert: pelangganInsert },
        tiket: { insert: tiketInsert },
        tiket_teknisi: { insert: jest.fn().mockResolvedValue({ error: null }) },
        notifikasi: { insert: jest.fn().mockResolvedValue({ error: null }) },
        tiket_status_log: { insert: jest.fn().mockResolvedValue({ error: null }) },
        users: {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [{ id: "teknisi-1", nama: "Teknisi Satu" }],
                error: null,
              }),
          }),
        },
      })[table],
    functions: { invoke },
  } as unknown as SupabaseClient;

  const result = await createTiketWithAssignment(client, {
    jenis: "instalasi",
    wilayahId: "wilayah-1",
    createdBy: "admin-1",
    teknisiIds: ["teknisi-1"],
    pelangganBaru: {
      nama: "Dedi",
      alamat: "Jl. Anggrek 3",
      noHp: "0814",
      odpId: "odp-1",
      paketId: "paket-1",
      mikrotikUsername: "dedi01",
      tanggalInstalasi: "2026-08-20",
    },
  });

  expect(result.success).toBe(true);
  expect(result).toMatchObject({
    success: true,
    tiketId: "tiket-5",
    mikrotikWarning: expect.stringContaining("gagal set Username Mikrotik"),
  });
});

test("Instalasi: a Pelanggan creation failure stops before creating the Tiket", async () => {
  const pelangganInsert = fakeInsertSelectSingle({
    data: null,
    error: { message: "insert failed" },
  });
  const tiketInsert = jest.fn();

  const client = fakeClient({
    paket: {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { harga: 200000 }, error: null }),
        }),
      }),
    },
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
      mikrotikUsername: "budi01",
      tanggalInstalasi: "2026-08-20",
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
