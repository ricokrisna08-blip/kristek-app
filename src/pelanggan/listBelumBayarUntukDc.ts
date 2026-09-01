import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganBelumBayarDc = {
  id: string;
  nama: string;
  alamat: string;
  noHp: string;
  catatan: string | null;
  tagihan: number;
  dcFlaggedLunas: boolean;
  dcFlaggedByMe: boolean;
  prioritasDc: boolean;
};

// Sama seperti countBelumBayar.ts: tagihan efektif dari Harga
// Langganan/Tagihan Prorata dikurangi Kompensasi, floor di 0 -- Pelanggan
// dengan tagihan efektif 0 (mis. Benefit) tidak pernah ditagih jadi tidak
// perlu ditagih DC juga.
export async function listBelumBayarUntukDc(
  client: SupabaseClient,
  currentUserId: string
): Promise<PelangganBelumBayarDc[]> {
  const { data, error } = await client
    .from("pelanggan")
    .select(
      "id, nama, alamat, no_hp, catatan, harga, tagihan_prorata, kompensasi_nominal, dc_flagged_lunas, dc_flagged_by, prioritas_dc"
    )
    .eq("sudah_bayar_bulan_ini", false)
    .order("prioritas_dc", { ascending: false })
    .order("alamat");

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
        alamat: row.alamat,
        noHp: row.no_hp,
        catatan: row.catatan ?? null,
        tagihan,
        dcFlaggedLunas: row.dc_flagged_lunas,
        dcFlaggedByMe: row.dc_flagged_lunas && row.dc_flagged_by === currentUserId,
        prioritasDc: row.prioritas_dc,
      };
    })
    .filter((row) => row.tagihan > 0);
}
