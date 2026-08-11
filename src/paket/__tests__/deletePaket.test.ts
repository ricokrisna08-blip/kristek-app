import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePaket } from "../deletePaket";

function fakeClient(deleteResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve(deleteResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("a Paket with no dependents is deleted successfully", async () => {
  const client = fakeClient({ error: null });

  const result = await deletePaket(client, "paket-1");

  expect(result).toEqual({ success: true });
});

test("a Paket still used by a Pelanggan is rejected with a clear message", async () => {
  const client = fakeClient({
    error: { code: "23503", message: "foreign key violation" },
  });

  const result = await deletePaket(client, "paket-1");

  expect(result).toEqual({
    success: false,
    error: "Paket ini masih dipakai Pelanggan, tidak bisa dihapus.",
  });
});
