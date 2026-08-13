import type { SupabaseClient } from "@supabase/supabase-js";

export type UpdateMikrotikUsernameResult =
  | { success: true }
  | { success: false; error: string };

export async function updateMikrotikUsername(
  client: SupabaseClient,
  id: string,
  mikrotikUsername: string
): Promise<UpdateMikrotikUsernameResult> {
  const { error } = await client
    .from("pelanggan")
    .update({ mikrotik_username: mikrotikUsername })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan Username Mikrotik. Coba lagi." };
  }

  return { success: true };
}
