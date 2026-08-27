import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePengeluaran } from "../deletePengeluaran";

function fakeClient(error: unknown = null): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve({ error }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("deletes the row on success", async () => {
  const client = fakeClient();

  const result = await deletePengeluaran(client, "pengeluaran-1");

  expect(result).toEqual({ success: true });
});

test("returns a clear error instead of crashing", async () => {
  const client = fakeClient({ message: "db error" });

  const result = await deletePengeluaran(client, "pengeluaran-1");

  expect(result).toEqual({ success: false, error: "Gagal menghapus pengeluaran. Coba lagi." });
});
