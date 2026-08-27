import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePelanggan } from "../updatePelanggan";

function fakeClient(options: {
  paketHarga?: number | null;
  updateResult: { error: unknown };
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "paket") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { harga: options.paketHarga ?? null }, error: null }),
            }),
          }),
        };
      }
      return {
        update: () => ({
          eq: () => Promise.resolve(options.updateResult),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

const validInput = {
  nama: "Budi Santoso",
  alamat: "Jl. Melati 2",
  noHp: "081234567891",
  odpId: "odp-2",
  wilayahId: "wilayah-2",
  paketId: "paket-2",
  tanggalInstalasi: null,
  catatan: null,
};

test("valid input updates the Pelanggan, including moving ODP/Paket/Wilayah", async () => {
  const client = fakeClient({ updateResult: { error: null } });

  const result = await updatePelanggan(client, "pelanggan-1", validInput);

  expect(result).toEqual({ success: true, tanggalInstalasi: null, tagihanProrata: null });
});

test("setting Tanggal Instalasi recomputes Tagihan Prorata from the Paket's harga", async () => {
  const client = fakeClient({ paketHarga: 165000, updateResult: { error: null } });

  const result = await updatePelanggan(client, "pelanggan-1", {
    ...validInput,
    tanggalInstalasi: "2026-08-20",
  });

  expect(result).toEqual({
    success: true,
    tanggalInstalasi: "2026-08-20",
    tagihanProrata: 74516,
  });
});

test("an update failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    updateResult: { error: { code: "23503", message: "foreign key violation" } },
  });

  const result = await updatePelanggan(client, "pelanggan-1", validInput);

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan perubahan Pelanggan. Coba lagi.",
  });
});
