import type { SupabaseClient } from "@supabase/supabase-js";
import { updateSudahBayarBulanIni } from "./updateSudahBayarBulanIni";

export type ApproveSetoranDcResult = { success: true } | { success: false; error: string };

// Reuse jalur "Sudah Bayar Bulan Ini" yang sudah ada (Edge Function
// mark-sudah-bayar, sudah handle auto-cabut-isolir Mikrotik kalau perlu)
// -- approve setoran DC secara efek sama persis kayak Admin/Pemilik
// centang manual, cuma dipicu dari layar berbeda. Baru setelah itu
// berhasil, bersihkan flag DC-nya.
export async function approveSetoranDc(
  client: SupabaseClient,
  pelangganId: string
): Promise<ApproveSetoranDcResult> {
  const result = await updateSudahBayarBulanIni(client, pelangganId, true);
  if (!result.success) {
    return result;
  }

  const { error } = await client
    .from("pelanggan")
    .update({ dc_flagged_lunas: false, dc_flagged_by: null, dc_flagged_at: null })
    .eq("id", pelangganId);

  if (error) {
    return { success: false, error: error.message || "Gagal membersihkan status setoran DC." };
  }

  return { success: true };
}
