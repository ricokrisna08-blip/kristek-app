import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteTiket } from "../deleteTiket";

function fakeClient(options: { deleteError?: unknown } = {}): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve({ error: options.deleteError ?? null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("deletes a single Tiket successfully", async () => {
  const client = fakeClient();

  const result = await deleteTiket(client, "tiket-1");

  expect(result).toEqual({ success: true });
});

test("a delete failure returns a clear error", async () => {
  const client = fakeClient({ deleteError: { message: "network error" } });

  const result = await deleteTiket(client, "tiket-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus Tiket. Coba lagi.",
  });
});
