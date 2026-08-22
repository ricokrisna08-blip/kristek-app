import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteAllTiket } from "../deleteAllTiket";

function fakeClient(options: { deleteError?: unknown } = {}): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        not: () => Promise.resolve({ error: options.deleteError ?? null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("deletes all Tiket successfully", async () => {
  const client = fakeClient();

  const result = await deleteAllTiket(client);

  expect(result).toEqual({ success: true });
});

test("a delete failure returns a clear error", async () => {
  const client = fakeClient({ deleteError: { message: "network error" } });

  const result = await deleteAllTiket(client);

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus semua Tiket. Coba lagi.",
  });
});
