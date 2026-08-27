import type { SupabaseClient } from "@supabase/supabase-js";

export type RejectSetoranDcResult = { success: true } | { success: false; error: string };

// Reset centang DC TANPA menyentuh sudah_bayar_bulan_ini -- dipakai
// Pemilik waktu setoran yang di-klaim DC ternyata salah/nggak sesuai.
export async function rejectSetoranDc(
  client: SupabaseClient,
  pelangganId: string
): Promise<RejectSetoranDcResult> {
  const { error } = await client
    .from("pelanggan")
    .update({ dc_flagged_lunas: false, dc_flagged_by: null, dc_flagged_at: null })
    .eq("id", pelangganId);

  if (error) {
    return { success: false, error: error.message || "Gagal menolak setoran DC." };
  }

  return { success: true };
}
