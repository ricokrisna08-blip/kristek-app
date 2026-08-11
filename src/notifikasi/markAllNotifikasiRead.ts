import type { SupabaseClient } from "@supabase/supabase-js";

export async function markAllNotifikasiRead(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  await client
    .from("notifikasi")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
