import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganListItem = {
  id: string;
  nama: string;
  nomorPelanggan: string;
};

export async function searchPelanggan(
  client: SupabaseClient,
  query: string
): Promise<PelangganListItem[]> {
  const { data, error } = await client
    .from("pelanggan")
    .select("id, nama, nomor_pelanggan")
    .or(`nama.ilike.%${query}%,nomor_pelanggan.ilike.%${query}%`)
    .order("nama");

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    nama: row.nama,
    nomorPelanggan: row.nomor_pelanggan,
  }));
}
