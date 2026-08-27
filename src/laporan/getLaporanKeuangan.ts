import type { SupabaseClient } from "@supabase/supabase-js";

export type LaporanBulananItem = {
  periode: string;
  label: string;
  totalUser: number;
  omset: number;
  sudahBayar: number;
  belumBayar: number;
  diTanganDc: number;
  persen: number;
  isBulanIni: boolean;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatPeriodeLabel(periode: string): string {
  const [year, month] = periode.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  const shortYear = year.slice(2);
  return `${MONTH_LABELS[monthIndex] ?? month}-${shortYear}`;
}

function persenOf(sudahBayar: number, omset: number): number {
  if (omset <= 0) return 0;
  return Math.round((sudahBayar / omset) * 1000) / 10;
}

function currentPeriode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export async function getLaporanKeuangan(
  client: SupabaseClient
): Promise<LaporanBulananItem[]> {
  const [historyResult, pelangganResult] = await Promise.all([
    client
      .from("laporan_bulanan")
      .select("periode, total_user, omset, sudah_bayar, belum_bayar")
      .order("periode", { ascending: true }),
    client
      .from("pelanggan")
      .select(
        "harga, tagihan_prorata, kompensasi_nominal, sudah_bayar_bulan_ini, dc_flagged_lunas"
      ),
  ]);

  const history = historyResult.data ?? [];
  const items: LaporanBulananItem[] = history.map((row: any) => ({
    periode: row.periode,
    label: formatPeriodeLabel(row.periode),
    totalUser: row.total_user,
    omset: row.omset,
    sudahBayar: row.sudah_bayar,
    belumBayar: row.belum_bayar,
    // Snapshot bulanan (laporan_bulanan) tidak mencatat ini -- di titik
    // snapshot (tanggal 15), setoran DC yang masih menggantung sudah
    // di-reset (lihat mikrotik-daily-billing-cycle), jadi histori bulan
    // lalu memang tidak relevan buat metrik ini.
    diTanganDc: 0,
    persen: persenOf(row.sudah_bayar, row.omset),
    isBulanIni: false,
  }));

  const pelangganRows = pelangganResult.data ?? [];
  const totalUser = pelangganRows.length;
  let omset = 0;
  let sudahBayar = 0;
  let belumBayar = 0;
  let diTanganDc = 0;
  for (const row of pelangganRows as any[]) {
    const dasar = row.tagihan_prorata ?? row.harga ?? 0;
    const tagihan = Math.max(dasar - (row.kompensasi_nominal ?? 0), 0);
    omset += tagihan;
    if (row.sudah_bayar_bulan_ini) {
      sudahBayar += tagihan;
    } else {
      belumBayar += tagihan;
      // Uang yang sudah dicentang DC ("sudah bayar ke saya") tapi belum
      // di-approve Pemilik -- masih terhitung "belum bayar" di sistem
      // (RLS/downstream lain belum berubah), tapi fisiknya sudah di
      // tangan DC, bukan lagi di Pelanggan. Ditampilkan terpisah supaya
      // Pemilik bisa lihat berapa yang perlu ditagih ke DC, bukan ke
      // Pelanggan lagi.
      if (row.dc_flagged_lunas) {
        diTanganDc += tagihan;
      }
    }
  }

  const periode = currentPeriode();
  items.push({
    periode,
    label: formatPeriodeLabel(periode),
    totalUser,
    omset,
    sudahBayar,
    belumBayar,
    diTanganDc,
    persen: persenOf(sudahBayar, omset),
    isBulanIni: true,
  });

  // Tampilkan cuma 3 bulan terakhir (termasuk bulan berjalan yang live).
  return items.slice(-3);
}
