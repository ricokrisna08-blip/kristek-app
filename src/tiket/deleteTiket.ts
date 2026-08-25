import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteTiketResult = { success: true } | { success: false; error: string };

// Hapus SATU Tiket -- cascade otomatis membersihkan tiket_teknisi,
// tiket_foto, tiket_status_log, dan notifikasi yang terkait ke Tiket ini
// (lihat migration 20260101060000/20260101120000/20260101130000). File
// foto di Storage TIDAK ikut terhapus otomatis. Khusus Pemilik (lihat
// canResetTiketData) -- dipakai buat "hapus paksa" satu Tiket dari Daftar
// Tiket, mis. Tiket aktif yang jadi penghalang hapus Pelanggan-nya.
export async function deleteTiket(
  client: SupabaseClient,
  tiketId: string
): Promise<DeleteTiketResult> {
  const { error } = await client.from("tiket").delete().eq("id", tiketId);

  if (error) {
    return { success: false, error: "Gagal menghapus Tiket. Coba lagi." };
  }

  return { success: true };
}
