import type { SupabaseClient } from "@supabase/supabase-js";

export async function markNotifikasiRead(
  client: SupabaseClient,
  id: string
): Promise<void> {
  await client
    .from("notifikasi")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
}
