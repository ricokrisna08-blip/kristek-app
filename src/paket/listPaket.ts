import type { SupabaseClient } from "@supabase/supabase-js";

export type Paket = {
  id: string;
  nama: string;
};

export async function listPaket(client: SupabaseClient): Promise<Paket[]> {
  const { data, error } = await client
    .from("paket")
    .select("id, nama")
    .order("nama");

  if (error || !data) {
    return [];
  }

  return data;
}
