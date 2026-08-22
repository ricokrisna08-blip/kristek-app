import type { SupabaseClient } from "@supabase/supabase-js";

export type CaptureTiketEvidenceLokasiInput = {
  tiketId: string;
  latitude: number;
  longitude: number;
};

export type CaptureTiketEvidenceLokasiResult =
  | { success: true }
  | { success: false; error: string };

// Simpan titik GPS "lokasi rumah pelanggan" -- item checklist bukti yang
// TANPA foto, beda dari Redaman/ONT/Kabel & Jalur.
export async function captureTiketEvidenceLokasi(
  client: SupabaseClient,
  input: CaptureTiketEvidenceLokasiInput
): Promise<CaptureTiketEvidenceLokasiResult> {
  const { error } = await client
    .from("tiket")
    .update({
      evidence_lokasi_latitude: input.latitude,
      evidence_lokasi_longitude: input.longitude,
      evidence_lokasi_captured_at: new Date().toISOString(),
    })
    .eq("id", input.tiketId);

  if (error) {
    return { success: false, error: "Gagal menyimpan lokasi. Coba lagi." };
  }

  return { success: true };
}
