import type { SupabaseClient } from "@supabase/supabase-js";
import { setPengeluaranSudahDibayar } from "../setPengeluaranSudahDibayar";

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

test("marks a row as sudah dibayar", async () => {
  const { client, updateCalls } = fakeClient();

  const result = await setPengeluaranSudahDibayar(client, "pengeluaran-1", true);

  expect(result).toEqual({ success: true });
  expect(updateCalls).toEqual([{ sudah_dibayar: true }]);
});

test("can un-check a row back to belum dibayar", async () => {
  const { client, updateCalls } = fakeClient();

  await setPengeluaranSudahDibayar(client, "pengeluaran-1", false);

  expect(updateCalls).toEqual([{ sudah_dibayar: false }]);
});

test("returns a clear error instead of crashing", async () => {
  const { client } = fakeClient({ message: "db error" });

  const result = await setPengeluaranSudahDibayar(client, "pengeluaran-1", true);

  expect(result).toEqual({ success: false, error: "Gagal menyimpan status pembayaran. Coba lagi." });
});
