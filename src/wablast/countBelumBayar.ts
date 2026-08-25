import type { SupabaseClient } from "@supabase/supabase-js";

// Pelanggan dengan tagihan efektif 0 (mis. Benefit RT/RW yang harganya
// memang 0, atau Kompensasi gangguan yang menutup seluruh tagihan bulan
// ini) tidak dihitung -- mereka memang tidak pernah ditagih. Ini murni
// berdasarkan angka Harga Langganan/Tagihan Prorata dikurangi Kompensasi,
// BUKAN flag is_benefit -- kalau Pemilik ubah manual Harga Langganan
// Pelanggan Benefit itu jadi > 0, dia tetap dihitung & masuk target blast
// WA (lihat fetchBillingFromSupabase.ts di kristek-wa-blast, yang pakai
// logic sama).
export async function countBelumBayar(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from("pelanggan")
    .select("harga, tagihan_prorata, kompensasi_nominal")
    .eq("sudah_bayar_bulan_ini", false);

  return (data ?? []).filter((row) => {
    const dasar = row.tagihan_prorata ?? row.harga ?? 0;
    const efektif = Math.max(dasar - (row.kompensasi_nominal ?? 0), 0);
    return efektif > 0;
  }).length;
}
