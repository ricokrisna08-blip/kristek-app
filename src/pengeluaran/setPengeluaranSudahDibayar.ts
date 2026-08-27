import type { SupabaseClient } from "@supabase/supabase-js";

export type SetPengeluaranSudahDibayarResult =
  | { success: true }
  | { success: false; error: string };

export async function setPengeluaranSudahDibayar(
  client: SupabaseClient,
  id: string,
  sudahDibayar: boolean
): Promise<SetPengeluaranSudahDibayarResult> {
  const { error } = await client
    .from("pengeluaran")
    .update({ sudah_dibayar: sudahDibayar })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan status pembayaran. Coba lagi." };
  }

  return { success: true };
}
