import type { SupabaseClient } from "@supabase/supabase-js";

export type Wilayah = {
  id: string;
  nama: string;
};

export async function listWilayah(client: SupabaseClient): Promise<Wilayah[]> {
  const { data, error } = await client
    .from("wilayah")
    .select("id, nama")
    .order("nama");

  if (error || !data) {
    return [];
  }

  return data;
}
