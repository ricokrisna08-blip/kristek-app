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
    dc_flagged_lunas?: boolean;
  }>;
  pengeluaran?: Array<{
    nominal: number | null;
    persen: number | null;
    tanggal: string;
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
      if (table === "pengeluaran") {
        return {
          select: () => ({
            gte: () => Promise.resolve({ data: options.pengeluaran ?? [], error: null }),
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
    diTanganDc: 0,
    totalPengeluaran: 0,
    sisaUang: 12570334,
    persen: 94.7,
    isBulanIni: false,
  });
  expect(result[1]).toMatchObject({
    totalUser: 2,
    omset: 365000,
    sudahBayar: 165000,
    belumBayar: 200000,
    diTanganDc: 0,
    totalPengeluaran: 0,
    sisaUang: 165000,
    persen: 45.2,
    isBulanIni: true,
  });
});

test("live current month separates money already in the DC's hands (flagged, not yet approved) from plain belum-bayar", async () => {
  const client = fakeClient({
    history: [],
    pelanggan: [
      { harga: 165000, sudah_bayar_bulan_ini: false, dc_flagged_lunas: true },
      { harga: 200000, sudah_bayar_bulan_ini: false, dc_flagged_lunas: false },
      { harga: 100000, sudah_bayar_bulan_ini: true, dc_flagged_lunas: false },
    ],
  });

  const result = await getLaporanKeuangan(client);

  expect(result[0]).toMatchObject({
    omset: 165000 + 200000 + 100000,
    sudahBayar: 100000,
    belumBayar: 165000 + 200000,
    diTanganDc: 165000,
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

test("totalPengeluaran sums flat-nominal rows for the matching periode, sisaUang subtracts it from sudahBayar", async () => {
  const client = fakeClient({
    history: [
      { periode: "2025-07-01", total_user: 10, omset: 1000000, sudah_bayar: 1000000, belum_bayar: 0 },
    ],
    pelanggan: [{ harga: 165000, sudah_bayar_bulan_ini: true }],
    pengeluaran: [
      { nominal: 1500000, persen: null, tanggal: "2025-07-05" },
      { nominal: 500000, persen: null, tanggal: "2025-07-20" },
    ],
  });

  const result = await getLaporanKeuangan(client);

  expect(result[0]).toMatchObject({
    periode: "2025-07-01",
    sudahBayar: 1000000,
    totalPengeluaran: 2000000,
    sisaUang: 1000000 - 2000000,
  });
});

test("persen-based pengeluaran rows are computed from that periode's own sudahBayar", async () => {
  const client = fakeClient({
    history: [
      { periode: "2025-07-01", total_user: 10, omset: 1000000, sudah_bayar: 1000000, belum_bayar: 0 },
    ],
    pelanggan: [{ harga: 165000, sudah_bayar_bulan_ini: true }],
    pengeluaran: [{ nominal: null, persen: 3, tanggal: "2025-07-05" }],
  });

  const result = await getLaporanKeuangan(client);

  expect(result[0]).toMatchObject({
    totalPengeluaran: 30000, // 3% of 1,000,000
    sisaUang: 1000000 - 30000,
  });
});

test("pengeluaran rows are grouped per periode, not mixed across months", async () => {
  const client = fakeClient({
    history: [
      { periode: "2025-06-01", total_user: 10, omset: 1000000, sudah_bayar: 1000000, belum_bayar: 0 },
      { periode: "2025-07-01", total_user: 10, omset: 1000000, sudah_bayar: 2000000, belum_bayar: 0 },
    ],
    pelanggan: [{ harga: 165000, sudah_bayar_bulan_ini: true }],
    pengeluaran: [
      { nominal: 100000, persen: null, tanggal: "2025-06-10" },
      { nominal: 250000, persen: null, tanggal: "2025-07-10" },
    ],
  });

  const result = await getLaporanKeuangan(client);

  expect(result[0]).toMatchObject({ periode: "2025-06-01", totalPengeluaran: 100000 });
  expect(result[1]).toMatchObject({ periode: "2025-07-01", totalPengeluaran: 250000 });
});
