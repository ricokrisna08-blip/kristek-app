import type { SupabaseClient } from "@supabase/supabase-js";
import { activateMikrotikAfterInstalasi } from "../activateMikrotikAfterInstalasi";

function fakeClient(invokeResult: { data: unknown; error: unknown }): SupabaseClient {
  return {
    functions: {
      invoke: () => Promise.resolve(invokeResult),
    },
  } as unknown as SupabaseClient;
}

test("succeeds when the function reports success", async () => {
  const client = fakeClient({ data: { success: true }, error: null });

  const result = await activateMikrotikAfterInstalasi(client, "tiket-1");

  expect(result).toEqual({ success: true });
});

test("a network/invoke failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await activateMikrotikAfterInstalasi(client, "tiket-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghubungi Mikrotik. Coba lagi.",
  });
});

test("a business error from the function (e.g. Tiket not eligible) surfaces its message", async () => {
  const client = fakeClient({
    data: { error: "Tiket ini bukan Instalasi yang sudah selesai." },
    error: null,
  });

  const result = await activateMikrotikAfterInstalasi(client, "tiket-1");

  expect(result).toEqual({
    success: false,
    error: "Tiket ini bukan Instalasi yang sudah selesai.",
  });
});

test("a non-2xx response (FunctionsHttpError) surfaces the real error message from its body", async () => {
  const client = fakeClient({
    data: null,
    error: {
      message: "Edge Function returned a non-2xx status code",
      context: {
        json: () =>
          Promise.resolve({ error: 'PPP secret "budi123" tidak ditemukan di Mikrotik.' }),
      },
    },
  });

  const result = await activateMikrotikAfterInstalasi(client, "tiket-1");

  expect(result).toEqual({
    success: false,
    error: 'PPP secret "budi123" tidak ditemukan di Mikrotik.',
  });
});
