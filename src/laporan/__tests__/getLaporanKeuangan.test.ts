import type { SupabaseClient } from "@supabase/supabase-js";
import { getLaporanKeuangan } from "../getLaporanKeuangan";

function fakeClient(options: {
  history: Array<{
    periode: string;
    total_user: number;
    omset: number;
    sudah_bayar: number;
    belum_bayar: number;
  }>;
  pelanggan: Array<{
    harga: number | null;
    tagihan_prorata?: number | null;
    kompensasi_nominal?: number | null;
    sudah_bayar_bulan_ini: boolean;
  }>;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "laporan_bulanan") {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: options.history, error: null }),
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: options.pelanggan, error: null }),
      };
    },
  } as unknown as SupabaseClient;
}

test("appends the live current month after the historical rows", async () => {
  const client = fakeClient({
    history: [
      { periode: "2025-10-01", total_user: 70, omset: 13275334, sudah_bayar: 12570334, belum_bayar: 705000 },
    ],
    pelanggan: [
      { harga: 165000, sudah_bayar_bulan_ini: true },
      { harga: 200000, sudah_bayar_bulan_ini: false },
    ],
  });

  const result = await getLaporanKeuangan(client);

  expect(result).toHaveLength(2);
  expect(result[0]).toEqual({
    periode: "2025-10-01",
    label: "Oct-25",
    totalUser: 70,
    omset: 13275334,
    sudahBayar: 12570334,
    belumBayar: 705000,
    persen: 94.7,
    isBulanIni: false,
  });
  expect(result[1]).toMatchObject({
    totalUser: 2,
    omset: 365000,
    sudahBayar: 165000,
    belumBayar: 200000,
    persen: 45.2,
    isBulanIni: true,
  });
});

test("treats a null harga as 0 instead of skewing the total", async () => {
  const client = fakeClient({
    history: [],
    pelanggan: [{ harga: null, sudah_bayar_bulan_ini: false }],
  });

  const result = await getLaporanKeuangan(client);

  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ totalUser: 1, omset: 0, sudahBayar: 0, belumBayar: 0, persen: 0 });
});

test("persen is 0 when omset is 0, not NaN or Infinity", async () => {
  const client = fakeClient({ history: [], pelanggan: [] });

  const result = await getLaporanKeuangan(client);

  expect(result[0].persen).toBe(0);
  expect(result[0].totalUser).toBe(0);
});

test("live current month uses effective tagihan (prorata basis, minus kompensasi), not raw harga", async () => {
  const client = fakeClient({
    history: [],
    pelanggan: [
      // Prorata: dasar dari tagihan_prorata, bukan harga penuh.
      { harga: 165000, tagihan_prorata: 80000, sudah_bayar_bulan_ini: false },
      // Kompensasi: dikurangi dari harga dasar, floor di 0.
      { harga: 165000, kompensasi_nominal: 200000, sudah_bayar_bulan_ini: true },
      // Normal: harga penuh.
      { harga: 100000, sudah_bayar_bulan_ini: true },
    ],
  });

  const result = await getLaporanKeuangan(client);

  expect(result[0]).toMatchObject({
    totalUser: 3,
    omset: 80000 + 0 + 100000,
    sudahBayar: 0 + 100000,
    belumBayar: 80000,
  });
});

test("only returns the last 3 months (2 historical + the live current month)", async () => {
  const client = fakeClient({
    history: [
      { periode: "2025-06-01", total_user: 50, omset: 9000000, sudah_bayar: 9000000, belum_bayar: 0 },
      { periode: "2025-07-01", total_user: 55, omset: 10000000, sudah_bayar: 9000000, belum_bayar: 1000000 },
      { periode: "2025-08-01", total_user: 60, omset: 11000000, sudah_bayar: 11000000, belum_bayar: 0 },
    ],
    pelanggan: [{ harga: 165000, sudah_bayar_bulan_ini: true }],
  });

  const result = await getLaporanKeuangan(client);

  expect(result).toHaveLength(3);
  expect(result[0].periode).toBe("2025-07-01");
  expect(result[1].periode).toBe("2025-08-01");
  expect(result[2].isBulanIni).toBe(true);
});
