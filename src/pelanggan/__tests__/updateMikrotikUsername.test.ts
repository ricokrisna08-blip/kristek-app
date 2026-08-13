import type { SupabaseClient } from "@supabase/supabase-js";
import { updateMikrotikUsername } from "../updateMikrotikUsername";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve(updateResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("valid username updates the Pelanggan's Mikrotik link", async () => {
  const client = fakeClient({ error: null });

  const result = await updateMikrotikUsername(client, "pelanggan-1", "budi123");

  expect(result).toEqual({ success: true });
});

test("an update failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    error: { code: "42501", message: "permission denied" },
  });

  const result = await updateMikrotikUsername(client, "pelanggan-1", "budi123");

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan Username Mikrotik. Coba lagi.",
  });
});
