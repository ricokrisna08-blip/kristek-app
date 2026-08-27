import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingSetoranDc = {
  id: string;
  nama: string;
  alamat: string;
  tagihan: number;
  dcNama: string;
  flaggedAt: string;
};

export async function listPendingSetoranDc(client: SupabaseClient): Promise<PendingSetoranDc[]> {
  const { data, error } = await client
    .from("pelanggan")
    .select(
      "id, nama, alamat, harga, tagihan_prorata, kompensasi_nominal, dc_flagged_at, dcFlaggedBy:dc_flagged_by ( nama )"
    )
    .eq("dc_flagged_lunas", true)
    .order("dc_flagged_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => {
    const dasar = row.tagihan_prorata ?? row.harga ?? 0;
    const tagihan = Math.max(dasar - (row.kompensasi_nominal ?? 0), 0);
    return {
      id: row.id,
      nama: row.nama,
      alamat: row.alamat,
      tagihan,
      dcNama: row.dcFlaggedBy?.nama ?? "DC",
      flaggedAt: row.dc_flagged_at,
    };
  });
}
