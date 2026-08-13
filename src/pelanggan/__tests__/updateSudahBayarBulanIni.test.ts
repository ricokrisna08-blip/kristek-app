import type { SupabaseClient } from "@supabase/supabase-js";
import { updateSudahBayarBulanIni } from "../updateSudahBayarBulanIni";

function fakeClient(invokeResult: { data: unknown; error: unknown }): SupabaseClient {
  return {
    functions: {
      invoke: () => Promise.resolve(invokeResult),
    },
  } as unknown as SupabaseClient;
}

test("marking Sudah Bayar Bulan Ini succeeds without isolir involved", async () => {
  const client = fakeClient({ data: { success: true, isolirCleared: false }, error: null });

  const result = await updateSudahBayarBulanIni(client, "pelanggan-1", true);

  expect(result).toEqual({ success: true, isolirCleared: false });
});

test("marking Sudah Bayar Bulan Ini for an isolir'd Pelanggan reports isolirCleared", async () => {
  const client = fakeClient({ data: { success: true, isolirCleared: true }, error: null });

  const result = await updateSudahBayarBulanIni(client, "pelanggan-1", true);

  expect(result).toEqual({ success: true, isolirCleared: true });
});

test("a business error from the function (e.g. missing Mikrotik username) surfaces its message", async () => {
  const client = fakeClient({
    data: {
      error:
        "Pelanggan ini sedang terisolir tapi belum punya Username Mikrotik -- tidak bisa dicabut isolir otomatis. Set Username Mikrotik dulu atau cabut isolir manual.",
    },
    error: null,
  });

  const result = await updateSudahBayarBulanIni(client, "pelanggan-1", true);

  expect(result.success).toBe(false);
});

test("an invoke failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await updateSudahBayarBulanIni(client, "pelanggan-1", true);

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan status bayar. Coba lagi.",
  });
});
