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
    const detail = await readFunctionErrorMessage(error);
    return { success: false, error: detail ?? "Gagal menghapus akun. Coba lagi." };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

// Supabase JS membungkus response non-2xx dari Edge Function jadi
// FunctionsHttpError, dengan body asli (termasuk pesan error kita, mis.
// "Akun ini masih punya riwayat Tiket") cuma bisa diakses lewat
// error.context (objek Response), bukan lewat `data`.
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
