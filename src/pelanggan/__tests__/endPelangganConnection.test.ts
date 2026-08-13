import type { SupabaseClient } from "@supabase/supabase-js";
import { endPelangganConnection } from "../endPelangganConnection";

function fakeClient(invokeResult: { data: unknown; error: unknown }): SupabaseClient {
  return {
    functions: {
      invoke: () => Promise.resolve(invokeResult),
    },
  } as unknown as SupabaseClient;
}

test("ending a connection succeeds and reports how many sessions were ended", async () => {
  const client = fakeClient({ data: { success: true, endedCount: 1 }, error: null });

  const result = await endPelangganConnection(client, "pelanggan-1");

  expect(result).toEqual({ success: true, endedCount: 1 });
});

test("a Pelanggan with no active session succeeds with endedCount 0", async () => {
  const client = fakeClient({ data: { success: true, endedCount: 0 }, error: null });

  const result = await endPelangganConnection(client, "pelanggan-1");

  expect(result).toEqual({ success: true, endedCount: 0 });
});

test("a business error from the function surfaces its message", async () => {
  const client = fakeClient({
    data: { error: "Pelanggan ini belum punya Username Mikrotik yang di-set." },
    error: null,
  });

  const result = await endPelangganConnection(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Pelanggan ini belum punya Username Mikrotik yang di-set.",
  });
});

test("a network/invoke failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await endPelangganConnection(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghubungi Mikrotik. Coba lagi.",
  });
});
