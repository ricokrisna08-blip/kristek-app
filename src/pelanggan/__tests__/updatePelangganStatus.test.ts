import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePelangganStatus } from "../updatePelangganStatus";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve(updateResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("valid input updates the Pelanggan's status & subsidi", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: true,
    isBenefit: false,
    subsidiAktif: 100000,
    prorate: true,
  });

  expect(result).toEqual({ success: true });
});

test("an update failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    error: { code: "42501", message: "permission denied" },
  });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: false,
    isBenefit: true,
    subsidiAktif: null,
    prorate: false,
  });

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan status Pelanggan. Coba lagi.",
  });
});
