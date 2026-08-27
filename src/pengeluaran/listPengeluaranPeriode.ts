import type { SupabaseClient } from "@supabase/supabase-js";

export type PengeluaranItem = {
  id: string;
  kategori: string;
  keterangan: string;
  nominal: number | null;
  persen: number | null;
  tanggal: string;
  // Baru dianggap "keluar" beneran (ikut kehitung ke kolom Pengeluaran/
  // Sisa Uang di getLaporanKeuangan.ts) begitu dicentang -- sebelum itu
  // baris ini cuma rencana/list, belum ngurangin apa-apa.
  sudahDibayar: boolean;
  // Nominal yang beneran kepakai di total: nominal apa adanya kalau
  // flat, atau round(sudahBayarPeriode * persen / 100) kalau
  // persentase -- dihitung ulang tiap kali dipanggil, jadi baris kayak
  // "Fee ISP 3%" otomatis ikut naik/turun seiring Sudah Bayar periode
  // itu bertambah, tanpa perlu diedit manual.
  efektif: number;
};

// periode = "YYYY-MM-01" (format yang sama dengan LaporanBulananItem.periode
// di getLaporanKeuangan.ts) -- dihitung murni dari string, BUKAN lewat
// Date/toISOString, supaya nggak kena geser timezone (toISOString selalu
// convert ke UTC, yang di WIB/UTC+7 bisa nggeser tanggal mundur).
function periodeRange(periode: string): { awal: string; akhir: string } {
  const [yearStr, monthStr] = periode.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    awal: `${yearStr}-${monthStr}-01`,
    akhir: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

export async function listPengeluaranPeriode(
  client: SupabaseClient,
  periode: string,
  sudahBayarPeriode: number
): Promise<PengeluaranItem[]> {
  const { awal, akhir } = periodeRange(periode);
  const { data, error } = await client
    .from("pengeluaran")
    .select("id, kategori, keterangan, nominal, persen, tanggal, sudah_dibayar")
    .gte("tanggal", awal)
    .lt("tanggal", akhir)
    .order("tanggal", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    kategori: row.kategori,
    keterangan: row.keterangan,
    nominal: row.nominal,
    persen: row.persen,
    tanggal: row.tanggal,
    sudahDibayar: row.sudah_dibayar,
    efektif:
      row.nominal != null
        ? row.nominal
        : Math.round((sudahBayarPeriode * row.persen) / 100),
  }));
}
