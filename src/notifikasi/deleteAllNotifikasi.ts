import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteAllNotifikasiResult =
  | { success: true }
  | { success: false; error: string };

// Hapus SEMUA baris Notifikasi (baik yang terkait Tiket maupun Pengajuan
// Cuti) -- lihat migration 20260822030000.
export async function deleteAllNotifikasi(
  client: SupabaseClient
): Promise<DeleteAllNotifikasiResult> {
  const { error } = await client.from("notifikasi").delete().not("id", "is", null);

  if (error) {
    return { success: false, error: "Gagal menghapus semua Notifikasi. Coba lagi." };
  }

  return { success: true };
}
