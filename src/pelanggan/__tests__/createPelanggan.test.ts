import type { SupabaseClient } from "@supabase/supabase-js";
import { createPelanggan } from "../createPelanggan";

function fakeClient(options: {
  paketHarga?: number | null;
  insertResult: { data: unknown; error: unknown };
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "paket") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { harga: options.paketHarga ?? null }, error: null }),
            }),
          }),
        };
      }
      return {
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve(options.insertResult),
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

test("valid input creates a new Pelanggan, inheriting its Paket's harga and computing tagihan prorata", async () => {
  const client = fakeClient({
    paketHarga: 165000,
    insertResult: {
      data: {
        id: "pelanggan-1",
        nama: "Budi Santoso",
        alamat: "Jl. Melati 1",
        no_hp: "081234567890",
        nomor_pelanggan: "PLG-000001",
        wilayah_id: "wilayah-1",
        odp_id: "odp-1",
        paket_id: "paket-1",
        harga: 165000,
        tanggal_instalasi: "2026-08-20",
        tagihan_prorata: 74516,
      },
      error: null,
    },
  });

  const result = await createPelanggan(client, {
    nama: "Budi Santoso",
    alamat: "Jl. Melati 1",
    noHp: "081234567890",
    wilayahId: "wilayah-1",
    odpId: "odp-1",
    paketId: "paket-1",
    tanggalInstalasi: "2026-08-20",
  });

  expect(result).toEqual({
    success: true,
    pelanggan: {
      id: "pelanggan-1",
      nama: "Budi Santoso",
      alamat: "Jl. Melati 1",
      noHp: "081234567890",
      nomorPelanggan: "PLG-000001",
      wilayahId: "wilayah-1",
      odpId: "odp-1",
      paketId: "paket-1",
      harga: 165000,
      tanggalInstalasi: "2026-08-20",
      tagihanProrata: 74516,
    },
  });
});

test("an insert failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    paketHarga: 200000,
    insertResult: {
      data: null,
      error: { code: "23503", message: "foreign key violation" },
    },
  });

  const result = await createPelanggan(client, {
    nama: "Budi Santoso",
    alamat: "Jl. Melati 1",
    noHp: "081234567890",
    wilayahId: "wilayah-1",
    odpId: "odp-1",
    paketId: "paket-1",
    tanggalInstalasi: "2026-08-20",
  });

  expect(result).toEqual({
    success: false,
    error: "Gagal menambah Pelanggan. Coba lagi.",
  });
});
