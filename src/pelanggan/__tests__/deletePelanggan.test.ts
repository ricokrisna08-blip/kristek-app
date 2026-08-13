import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePelanggan } from "../deletePelanggan";

function fakeClient(options: {
  activeTiketCount: number;
  checkError?: unknown;
  deleteError?: unknown;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          select: () => ({
            eq: () => ({
              in: () =>
                Promise.resolve({
                  count: options.activeTiketCount,
                  error: options.checkError ?? null,
                }),
            }),
          }),
        };
      }

      return {
        delete: () => ({
          eq: () => Promise.resolve({ error: options.deleteError ?? null }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

test("a Pelanggan with no Tiket at all is deleted successfully", async () => {
  const client = fakeClient({ activeTiketCount: 0 });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
});

test("a Pelanggan whose Tiket are all Selesai/Dibatalkan is deleted successfully", async () => {
  // The check query only counts active-status Tiket, so a Pelanggan with
  // only finished Tiket also reports activeTiketCount: 0.
  const client = fakeClient({ activeTiketCount: 0 });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({ success: true });
});

test("a Pelanggan with an active (non-finished) Tiket is rejected before attempting delete", async () => {
  const client = fakeClient({ activeTiketCount: 1 });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Pelanggan ini masih punya Tiket aktif (belum Selesai/Dibatalkan), tidak bisa dihapus.",
  });
});

test("a failure while checking Tiket status returns a clear error", async () => {
  const client = fakeClient({
    activeTiketCount: 0,
    checkError: { message: "network error" },
  });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal memeriksa Tiket Pelanggan. Coba lagi.",
  });
});

test("a delete failure after passing the check returns a clear error", async () => {
  const client = fakeClient({
    activeTiketCount: 0,
    deleteError: { code: "23503", message: "foreign key violation" },
  });

  const result = await deletePelanggan(client, "pelanggan-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus Pelanggan. Coba lagi.",
  });
});
