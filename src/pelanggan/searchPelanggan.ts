import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganListItem = {
  id: string;
  nama: string;
  nomorPelanggan: string;
};

// PostgREST's .or() takes a raw filter string where "," "(" ")" separate
// and group conditions. Without escaping, a query containing those
// characters (e.g. "a,role.eq.pemilik") can distort the filter instead of
// being treated as a literal search term. Wrapping the value in double
// quotes makes PostgREST treat it as a literal string; backslash and
// double-quote inside the value need their own escaping first.
function escapePostgrestFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function searchPelanggan(
  client: SupabaseClient,
  query: string
): Promise<PelangganListItem[]> {
  const escaped = escapePostgrestFilterValue(query);
  const { data, error } = await client
    .from("pelanggan")
    .select("id, nama, nomor_pelanggan")
    .or(`nama.ilike."%${escaped}%",nomor_pelanggan.ilike."%${escaped}%"`)
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
