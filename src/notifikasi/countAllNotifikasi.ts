import type { SupabaseClient } from "@supabase/supabase-js";

export async function countAllNotifikasi(client: SupabaseClient): Promise<number> {
  const { count } = await client
    .from("notifikasi")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
