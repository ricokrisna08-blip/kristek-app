import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteAccount(
  client: SupabaseClient,
  targetUserId: string
): Promise<DeleteAccountResult> {
  const { data, error } = await client.functions.invoke("delete-account", {
    body: { targetUserId },
  });

  if (error) {
    return { success: false, error: "Gagal menghapus akun. Coba lagi." };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}
