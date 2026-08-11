import type { SupabaseClient } from "@supabase/supabase-js";

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPassword(
  client: SupabaseClient,
  targetUserId: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  if (newPassword.length < 6) {
    return { success: false, error: "Password minimal 6 karakter" };
  }

  const { data, error } = await client.functions.invoke("reset-password", {
    body: { targetUserId, newPassword },
  });

  if (error) {
    return { success: false, error: "Gagal reset password. Coba lagi." };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}
