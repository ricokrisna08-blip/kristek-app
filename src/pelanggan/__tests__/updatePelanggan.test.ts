import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePelanggan } from "../updatePelanggan";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve(updateResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

const validInput = {
  nama: "Budi Santoso",
  alamat: "Jl. Melati 2",
  noHp: "081234567891",
  odpId: "odp-2",
  wilayahId: "wilayah-2",
  paketId: "paket-2",
};

test("valid input updates the Pelanggan, including moving ODP/Paket/Wilayah", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelanggan(client, "pelanggan-1", validInput);

  expect(result).toEqual({ success: true });
});

test("an update failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    error: { code: "23503", message: "foreign key violation" },
  });

  const result = await updatePelanggan(client, "pelanggan-1", validInput);

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan perubahan Pelanggan. Coba lagi.",
  });
});
