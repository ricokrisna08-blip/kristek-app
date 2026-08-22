import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteAllNotifikasi } from "../deleteAllNotifikasi";

function fakeClient(options: { deleteError?: unknown } = {}): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        not: () => Promise.resolve({ error: options.deleteError ?? null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("deletes all Notifikasi successfully", async () => {
  const client = fakeClient();

  const result = await deleteAllNotifikasi(client);

  expect(result).toEqual({ success: true });
});

test("a delete failure returns a clear error", async () => {
  const client = fakeClient({ deleteError: { message: "network error" } });

  const result = await deleteAllNotifikasi(client);

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus semua Notifikasi. Coba lagi.",
  });
});
