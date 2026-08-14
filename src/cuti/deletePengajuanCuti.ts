import type { SupabaseClient } from "@supabase/supabase-js";

export type DeletePengajuanCutiResult =
  | { success: true }
  | { success: false; error: string };

export async function deletePengajuanCuti(
  client: SupabaseClient,
  id: string
): Promise<DeletePengajuanCutiResult> {
  const { error } = await client.from("pengajuan_cuti").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menghapus pengajuan. Coba lagi." };
  }

  return { success: true };
}
