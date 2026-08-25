import type { SupabaseClient } from "@supabase/supabase-js";

// Pelanggan Benefit (mis. RT/RW yang dapat internet gratis) sengaja
// dikecualikan -- mereka memang tidak pernah ditagih, jadi tidak masuk
// hitungan (maupun target) blast WA tagihan.
export async function countBelumBayar(client: SupabaseClient): Promise<number> {
  const { count } = await client
    .from("pelanggan")
    .select("id", { count: "exact", head: true })
    .eq("sudah_bayar_bulan_ini", false)
    .eq("is_benefit", false);

  return count ?? 0;
}
