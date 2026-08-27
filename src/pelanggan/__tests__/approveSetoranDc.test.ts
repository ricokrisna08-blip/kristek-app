import type { SupabaseClient } from "@supabase/supabase-js";
import { approveSetoranDc } from "../approveSetoranDc";

function fakeClient(options: {
  invokeResult?: { data: unknown; error: unknown };
  updateError?: { message: string } | null;
}) {
  const updateCalls: unknown[] = [];

  const client = {
    functions: {
      invoke: () =>
        Promise.resolve(options.invokeResult ?? { data: { success: true, isolirCleared: false }, error: null }),
    },
    from: () => ({
      update: (payload: unknown) => {
        updateCalls.push(payload);
        return { eq: () => Promise.resolve({ error: options.updateError ?? null }) };
      },
    }),
  } as unknown as SupabaseClient;

  return { client, updateCalls };
}

test("marks sudah bayar via the existing edge function, then clears the DC flag", async () => {
  const { client, updateCalls } = fakeClient({});

  const result = await approveSetoranDc(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
  expect(updateCalls).toEqual([
    { dc_flagged_lunas: false, dc_flagged_by: null, dc_flagged_at: null },
  ]);
});

test("stops and surfaces the error if marking sudah bayar fails, without touching the DC flag", async () => {
  const { client, updateCalls } = fakeClient({
    invokeResult: { data: null, error: { message: "network error" } },
  });

  const result = await approveSetoranDc(client, "pelanggan-1");

  expect(result).toEqual({ success: false, error: "Gagal menyimpan status bayar. Coba lagi." });
  expect(updateCalls).toEqual([]);
});

test("surfaces an error if clearing the DC flag fails after sudah bayar succeeded", async () => {
  const { client } = fakeClient({ updateError: { message: "db error" } });

  const result = await approveSetoranDc(client, "pelanggan-1");

  expect(result).toEqual({ success: false, error: "db error" });
});
