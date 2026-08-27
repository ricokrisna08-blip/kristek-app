import type { SupabaseClient } from "@supabase/supabase-js";

export type DeletePengeluaranResult = { success: true } | { success: false; error: string };

export async function deletePengeluaran(
  client: SupabaseClient,
  id: string
): Promise<DeletePengeluaranResult> {
  const { error } = await client.from("pengeluaran").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menghapus pengeluaran. Coba lagi." };
  }

  return { success: true };
}
