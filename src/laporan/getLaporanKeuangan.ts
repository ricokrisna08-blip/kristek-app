import type { SupabaseClient } from "@supabase/supabase-js";

export type LaporanBulananItem = {
  periode: string;
  label: string;
  totalUser: number;
  omset: number;
  sudahBayar: number;
  belumBayar: number;
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
    client.from("pelanggan").select("harga, sudah_bayar_bulan_ini"),
  ]);

  const history = historyResult.data ?? [];
  const items: LaporanBulananItem[] = history.map((row: any) => ({
    periode: row.periode,
    label: formatPeriodeLabel(row.periode),
    totalUser: row.total_user,
    omset: row.omset,
    sudahBayar: row.sudah_bayar,
    belumBayar: row.belum_bayar,
    persen: persenOf(row.sudah_bayar, row.omset),
    isBulanIni: false,
  }));

  const pelangganRows = pelangganResult.data ?? [];
  const totalUser = pelangganRows.length;
  let omset = 0;
  let sudahBayar = 0;
  let belumBayar = 0;
  for (const row of pelangganRows as any[]) {
    const harga = row.harga ?? 0;
    omset += harga;
    if (row.sudah_bayar_bulan_ini) {
      sudahBayar += harga;
    } else {
      belumBayar += harga;
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
    persen: persenOf(sudahBayar, omset),
    isBulanIni: true,
  });

  return items;
}
