import type { SupabaseClient } from "@supabase/supabase-js";
import { setPelangganIsolir } from "../setPelangganIsolir";

function fakeClient(invokeResult: {
  data: unknown;
  error: unknown;
}): SupabaseClient {
  return {
    functions: {
      invoke: () => Promise.resolve(invokeResult),
    },
  } as unknown as SupabaseClient;
}

test("isolir succeeds when the function reports success", async () => {
  const client = fakeClient({ data: { success: true }, error: null });

  const result = await setPelangganIsolir(client, "pelanggan-1", true);

  expect(result).toEqual({ success: true });
});

test("a network/invoke failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await setPelangganIsolir(client, "pelanggan-1", true);

  expect(result).toEqual({
    success: false,
    error: "Gagal menghubungi Mikrotik. Coba lagi.",
  });
});

test("a business error from the function (e.g. missing Mikrotik username) surfaces its message", async () => {
  const client = fakeClient({
    data: { error: "Pelanggan ini belum punya Username Mikrotik yang di-set." },
    error: null,
  });

  const result = await setPelangganIsolir(client, "pelanggan-1", true);

  expect(result).toEqual({
    success: false,
    error: "Pelanggan ini belum punya Username Mikrotik yang di-set.",
  });
});

test("a non-2xx response (FunctionsHttpError) surfaces the real error message from its body", async () => {
  const client = fakeClient({
    data: null,
    error: {
      message: "Edge Function returned a non-2xx status code",
      context: {
        json: () =>
          Promise.resolve({ error: "Kredensial Mikrotik belum diset (lihat DEPLOY.md)." }),
      },
    },
  });

  const result = await setPelangganIsolir(client, "pelanggan-1", true);

  expect(result).toEqual({
    success: false,
    error: "Kredensial Mikrotik belum diset (lihat DEPLOY.md).",
  });
});
