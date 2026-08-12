import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganDetail = {
  id: string;
  nama: string;
  alamat: string;
  noHp: string;
  nomorPelanggan: string;
  wilayahNama: string | null;
  odpLabel: string | null;
  paketNama: string | null;
  harga: number | null;
};

export async function getPelangganDetail(
  client: SupabaseClient,
  id: string
): Promise<PelangganDetail | null> {
  const { data, error } = await client
    .from("pelanggan")
    .select(
      "id, nama, alamat, no_hp, nomor_pelanggan, wilayah:wilayah_id (nama), odp:odp_id (label), paket:paket_id (nama), harga"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as any;

  return {
    id: row.id,
    nama: row.nama,
    alamat: row.alamat,
    noHp: row.no_hp,
    nomorPelanggan: row.nomor_pelanggan,
    wilayahNama: row.wilayah?.nama ?? null,
    odpLabel: row.odp?.label ?? null,
    paketNama: row.paket?.nama ?? null,
    harga: row.harga ?? null,
  };
}
