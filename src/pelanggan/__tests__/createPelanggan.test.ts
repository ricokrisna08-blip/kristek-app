import type { SupabaseClient } from "@supabase/supabase-js";
import { createPelanggan } from "../createPelanggan";

function fakeClient(insertResult: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve(insertResult),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("valid input creates a new Pelanggan, including its Paket", async () => {
  const client = fakeClient({
    data: {
      id: "pelanggan-1",
      nama: "Budi Santoso",
      alamat: "Jl. Melati 1",
      no_hp: "081234567890",
      nomor_pelanggan: "PLG-000001",
      wilayah_id: "wilayah-1",
      odp_id: "odp-1",
      paket_id: "paket-1",
    },
    error: null,
  });

  const result = await createPelanggan(client, {
    nama: "Budi Santoso",
    alamat: "Jl. Melati 1",
    noHp: "081234567890",
    wilayahId: "wilayah-1",
    odpId: "odp-1",
    paketId: "paket-1",
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
    },
  });
});

test("an insert failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    data: null,
    error: { code: "23503", message: "foreign key violation" },
  });

  const result = await createPelanggan(client, {
    nama: "Budi Santoso",
    alamat: "Jl. Melati 1",
    noHp: "081234567890",
    wilayahId: "wilayah-1",
    odpId: "odp-1",
    paketId: "paket-1",
  });

  expect(result).toEqual({
    success: false,
    error: "Gagal menambah Pelanggan. Coba lagi.",
  });
});
