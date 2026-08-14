import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePengajuanCuti } from "../deletePengajuanCuti";

function fakeClient(deleteResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve(deleteResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("a pengajuan cuti is deleted successfully", async () => {
  const client = fakeClient({ error: null });

  const result = await deletePengajuanCuti(client, "cuti-1");

  expect(result).toEqual({ success: true });
});

test("a failed delete is reported with a clear message", async () => {
  const client = fakeClient({ error: { message: "network error" } });

  const result = await deletePengajuanCuti(client, "cuti-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus pengajuan. Coba lagi.",
  });
});
