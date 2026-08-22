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
    const detail = await readFunctionErrorMessage(error);
    return { success: false, error: detail ?? "Gagal reset password. Coba lagi." };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

// Supabase JS membungkus response non-2xx dari Edge Function jadi
// FunctionsHttpError, dengan body asli (termasuk pesan error kita) cuma
// bisa diakses lewat error.context (objek Response), bukan lewat `data`.
async function readFunctionErrorMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.json !== "function") return null;

  try {
    const body = await context.json();
    return typeof body?.error === "string" ? body.error : null;
  } catch {
    return null;
  }
}
