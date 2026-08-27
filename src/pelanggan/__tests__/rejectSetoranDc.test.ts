import type { SupabaseClient } from "@supabase/supabase-js";
import { rejectSetoranDc } from "../rejectSetoranDc";

function fakeClient(updateError?: { message: string } | null) {
  const updateCalls: unknown[] = [];

  const client = {
    from: () => ({
      update: (payload: unknown) => {
        updateCalls.push(payload);
        return { eq: () => Promise.resolve({ error: updateError ?? null }) };
      },
    }),
  } as unknown as SupabaseClient;

  return { client, updateCalls };
}

test("clears the DC flag without touching sudah_bayar_bulan_ini", async () => {
  const { client, updateCalls } = fakeClient(null);

  const result = await rejectSetoranDc(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
  expect(updateCalls).toEqual([
    { dc_flagged_lunas: false, dc_flagged_by: null, dc_flagged_at: null },
  ]);
});

test("surfaces a clear error instead of crashing", async () => {
  const { client } = fakeClient({ message: "db error" });

  const result = await rejectSetoranDc(client, "pelanggan-1");

  expect(result).toEqual({ success: false, error: "db error" });
});
