import type { SupabaseClient } from "@supabase/supabase-js";

export type ChangePasswordResult = { success: true } | { success: false; error: string };

export async function changePassword(
  client: SupabaseClient,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> {
  if (newPassword.length < 6) {
    return { success: false, error: "Password baru minimal 6 karakter." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Konfirmasi password tidak cocok." };
  }

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
