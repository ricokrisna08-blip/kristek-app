import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteOdp } from "../deleteOdp";

function fakeClient(deleteResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve(deleteResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("an ODP with no dependents is deleted successfully", async () => {
  const client = fakeClient({ error: null });

  const result = await deleteOdp(client, "odp-1");

  expect(result).toEqual({ success: true });
});

test("an ODP still in use is rejected with a clear message", async () => {
  const client = fakeClient({
    error: { code: "23503", message: "foreign key violation" },
  });

  const result = await deleteOdp(client, "odp-1");

  expect(result).toEqual({
    success: false,
    error: "ODP ini masih dipakai (Pelanggan/Tiket), tidak bisa dihapus.",
  });
});
