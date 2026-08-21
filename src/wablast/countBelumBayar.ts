import type { SupabaseClient } from "@supabase/supabase-js";

export async function countBelumBayar(client: SupabaseClient): Promise<number> {
  const { count } = await client
    .from("pelanggan")
    .select("id", { count: "exact", head: true })
    .eq("sudah_bayar_bulan_ini", false);

  return count ?? 0;
}
