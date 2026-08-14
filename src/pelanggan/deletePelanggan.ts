import type { SupabaseClient } from "@supabase/supabase-js";

export type DeletePelangganResult =
  | { success: true }
  | { success: false; error: string };

const AKTIF_STATUSES = ["baru", "ditugaskan", "dikerjakan", "pending"];

export type CheckPelangganCanBeDeletedResult =
  | { canDelete: true }
  | { canDelete: false; error: string };

// Diekspor terpisah supaya bisa dipanggil DULUAN sebelum langkah lain yang
// tidak boleh jalan kalau Pelanggan-nya ternyata tidak boleh dihapus --
// misalnya menghapus secret Mikrotik-nya (lihat PelangganManagementScreen)
// harus nunggu pengecekan ini lolos dulu, bukan sekaligus di dalam delete.
export async function checkPelangganCanBeDeleted(
  client: SupabaseClient,
  id: string
): Promise<CheckPelangganCanBeDeletedResult> {
  const { count: activeTiketCount, error: checkError } = await client
    .from("tiket")
    .select("id", { count: "exact", head: true })
    .eq("pelanggan_id", id)
    .in("status", AKTIF_STATUSES);

  if (checkError) {
    return { canDelete: false, error: "Gagal memeriksa Tiket Pelanggan. Coba lagi." };
  }

  if (activeTiketCount && activeTiketCount > 0) {
    return {
      canDelete: false,
      error:
        "Pelanggan ini masih punya Tiket aktif (belum Selesai/Dibatalkan), tidak bisa dihapus.",
    };
  }

  return { canDelete: true };
}

export async function deletePelanggan(
  client: SupabaseClient,
  id: string
): Promise<DeletePelangganResult> {
  const check = await checkPelangganCanBeDeleted(client, id);
  if (!check.canDelete) {
    return { success: false, error: check.error };
  }

  const { error } = await client.from("pelanggan").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menghapus Pelanggan. Coba lagi." };
  }

  return { success: true };
}
