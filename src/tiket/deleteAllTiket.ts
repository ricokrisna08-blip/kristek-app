import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteAllTiketResult =
  | { success: true }
  | { success: false; error: string };

// Hapus SEMUA baris Tiket -- cascade otomatis membersihkan tiket_teknisi,
// tiket_foto, tiket_status_log, dan notifikasi yang terkait ke Tiket
// (lihat migration 20260822030000). File foto di Storage TIDAK ikut
// terhapus otomatis.
export async function deleteAllTiket(client: SupabaseClient): Promise<DeleteAllTiketResult> {
  const { error } = await client.from("tiket").delete().not("id", "is", null);

  if (error) {
    return { success: false, error: "Gagal menghapus semua Tiket. Coba lagi." };
  }

  return { success: true };
}
