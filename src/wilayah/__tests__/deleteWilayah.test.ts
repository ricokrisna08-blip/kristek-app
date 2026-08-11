import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteWilayah } from "../deleteWilayah";

function fakeClient(deleteResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve(deleteResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("a Wilayah with no dependents is deleted successfully", async () => {
  const client = fakeClient({ error: null });

  const result = await deleteWilayah(client, "wilayah-1");

  expect(result).toEqual({ success: true });
});

test("a Wilayah still in use is rejected with a clear message", async () => {
  const client = fakeClient({
    error: { code: "23503", message: "foreign key violation" },
  });

  const result = await deleteWilayah(client, "wilayah-1");

  expect(result).toEqual({
    success: false,
    error: "Wilayah ini masih dipakai (Akun/Pelanggan/ODP/Tiket), tidak bisa dihapus.",
  });
});
