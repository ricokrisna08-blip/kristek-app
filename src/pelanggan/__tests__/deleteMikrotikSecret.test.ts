import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteMikrotikSecret } from "../deleteMikrotikSecret";

function fakeClient(invokeResult: { data: unknown; error: unknown }): SupabaseClient {
  return {
    functions: {
      invoke: () => Promise.resolve(invokeResult),
    },
  } as unknown as SupabaseClient;
}

test("succeeds when the function reports success", async () => {
  const client = fakeClient({ data: { success: true, deleted: true }, error: null });

  const result = await deleteMikrotikSecret(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
});

test("succeeds as a no-op when the Pelanggan never had a Username Mikrotik", async () => {
  const client = fakeClient({ data: { success: true, deleted: false }, error: null });

  const result = await deleteMikrotikSecret(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
});

test("a network/invoke failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await deleteMikrotikSecret(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghubungi Mikrotik. Coba lagi.",
  });
});

test("a business error from the function surfaces its message", async () => {
  const client = fakeClient({
    data: { error: "Gagal menghapus PPP secret di Mikrotik (500)." },
    error: null,
  });

  const result = await deleteMikrotikSecret(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus PPP secret di Mikrotik (500).",
  });
});
