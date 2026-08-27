import type { SupabaseClient } from "@supabase/supabase-js";

export type PengeluaranItem = {
  id: string;
  kategori: string;
  keterangan: string;
  nominal: number | null;
  persen: number | null;
  tanggal: string;
  // Nominal yang beneran kepakai di total: nominal apa adanya kalau
  // flat, atau round(sudahBayarBulanIni * persen / 100) kalau
  // persentase -- dihitung ulang tiap kali dipanggil, jadi baris kayak
  // "Fee ISP 3%" otomatis ikut naik/turun seiring Sudah Bayar bulan itu
  // bertambah, tanpa perlu diedit manual.
  efektif: number;
};

function bulanIniRange(): { awal: string; akhir: string } {
  const now = new Date();
  const awal = new Date(now.getFullYear(), now.getMonth(), 1);
  const akhir = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { awal: awal.toISOString().slice(0, 10), akhir: akhir.toISOString().slice(0, 10) };
}

export async function listPengeluaranBulanIni(
  client: SupabaseClient,
  sudahBayarBulanIni: number
): Promise<PengeluaranItem[]> {
  const { awal, akhir } = bulanIniRange();
  const { data, error } = await client
    .from("pengeluaran")
    .select("id, kategori, keterangan, nominal, persen, tanggal")
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
    efektif:
      row.nominal != null
        ? row.nominal
        : Math.round((sudahBayarBulanIni * row.persen) / 100),
  }));
}
