import type { SupabaseClient } from "@supabase/supabase-js";

export async function countAllTiket(client: SupabaseClient): Promise<number> {
  const { count } = await client.from("tiket").select("id", { count: "exact", head: true });
  return count ?? 0;
}
