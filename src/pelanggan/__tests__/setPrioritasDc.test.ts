import type { SupabaseClient } from "@supabase/supabase-js";
import { setPrioritasDc } from "../setPrioritasDc";

function fakeClient(error: unknown = null) {
  const updateCalls: unknown[] = [];

  const client = {
    from: () => ({
      update: (payload: unknown) => {
        updateCalls.push(payload);
        return { eq: () => Promise.resolve({ error }) };
      },
    }),
  } as unknown as SupabaseClient;

  return { client, updateCalls };
}

test("marks a pelanggan as prioritas DC", async () => {
  const { client, updateCalls } = fakeClient();

  const result = await setPrioritasDc(client, "pelanggan-1", true);

  expect(result).toEqual({ success: true });
  expect(updateCalls).toEqual([{ prioritas_dc: true }]);
});

test("can un-mark a pelanggan back to not prioritas", async () => {
  const { client, updateCalls } = fakeClient();

  await setPrioritasDc(client, "pelanggan-1", false);

  expect(updateCalls).toEqual([{ prioritas_dc: false }]);
});

test("returns a clear error instead of crashing", async () => {
  const { client } = fakeClient({ message: "db error" });

  const result = await setPrioritasDc(client, "pelanggan-1", true);

  expect(result).toEqual({ success: false, error: "Gagal menyimpan status prioritas. Coba lagi." });
});
