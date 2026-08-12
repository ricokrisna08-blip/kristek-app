import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePelangganHarga } from "../updatePelangganHarga";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve(updateResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("valid harga updates the Pelanggan's price", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelangganHarga(client, "pelanggan-1", 165000);

  expect(result).toEqual({ success: true });
});

test("an update failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    error: { code: "42501", message: "permission denied" },
  });

  const result = await updatePelangganHarga(client, "pelanggan-1", 165000);

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan harga. Coba lagi.",
  });
});
