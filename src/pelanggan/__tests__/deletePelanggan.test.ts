import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePelanggan } from "../deletePelanggan";

function fakeClient(deleteResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve(deleteResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("a Pelanggan with no dependents is deleted successfully", async () => {
  const client = fakeClient({ error: null });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
});

test("a Pelanggan with Tiket history is rejected with a clear message", async () => {
  const client = fakeClient({
    error: { code: "23503", message: "foreign key violation" },
  });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Pelanggan ini masih punya riwayat Tiket, tidak bisa dihapus.",
  });
});
