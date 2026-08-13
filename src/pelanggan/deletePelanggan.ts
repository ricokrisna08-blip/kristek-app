import type { SupabaseClient } from "@supabase/supabase-js";

export type DeletePelangganResult =
  | { success: true }
  | { success: false; error: string };

const AKTIF_STATUSES = ["baru", "ditugaskan", "dikerjakan", "pending"];

export async function deletePelanggan(
  client: SupabaseClient,
  id: string
): Promise<DeletePelangganResult> {
  const { count: activeTiketCount, error: checkError } = await client
    .from("tiket")
    .select("id", { count: "exact", head: true })
    .eq("pelanggan_id", id)
    .in("status", AKTIF_STATUSES);

  if (checkError) {
    return { success: false, error: "Gagal memeriksa Tiket Pelanggan. Coba lagi." };
  }

  if (activeTiketCount && activeTiketCount > 0) {
    return {
      success: false,
      error:
        "Pelanggan ini masih punya Tiket aktif (belum Selesai/Dibatalkan), tidak bisa dihapus.",
    };
  }

  const { error } = await client.from("pelanggan").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menghapus Pelanggan. Coba lagi." };
  }

  return { success: true };
}
