import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganBelumBayarWaBlast = {
  id: string;
  nama: string;
  tagihan: number;
  sudahDiblastBulanIni: boolean;
};

// Sama seperti countBelumBayar.ts/listBelumBayarUntukDc.ts: tagihan
// efektif dari Harga Langganan/Tagihan Prorata dikurangi Kompensasi,
// floor di 0. Dipakai buat picker "Pilih Pelanggan" di WaBlastScreen --
// beda dari listBelumBayarUntukDc.ts, di sini nggak butuh alamat/no_hp/
// catatan/dc-flag, cukup buat dicari by nama & dicentang.
export async function listBelumBayarUntukWaBlast(
  client: SupabaseClient
): Promise<PelangganBelumBayarWaBlast[]> {
  const { data, error } = await client
    .from("pelanggan")
    .select(
      "id, nama, harga, tagihan_prorata, kompensasi_nominal, sudah_diblast_bulan_ini"
    )
    .eq("sudah_bayar_bulan_ini", false)
    .order("nama");

  if (error || !data) {
    return [];
  }

  return data
    .map((row: any) => {
      const dasar = row.tagihan_prorata ?? row.harga ?? 0;
      const tagihan = Math.max(dasar - (row.kompensasi_nominal ?? 0), 0);
      return {
        id: row.id,
        nama: row.nama,
        tagihan,
        sudahDiblastBulanIni: row.sudah_diblast_bulan_ini,
      };
    })
    .filter((row) => row.tagihan > 0);
}
