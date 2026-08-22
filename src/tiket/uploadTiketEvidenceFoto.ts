import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceFotoType } from "./instalasiEvidence";

const PHOTO_BUCKET = "tiket-foto";

export type UploadTiketEvidenceFotoInput = {
  tiketId: string;
  uploadedBy: string;
  type: EvidenceFotoType;
  photoBlob: Blob;
  latitude?: number | null;
  longitude?: number | null;
};

export type UploadTiketEvidenceFotoResult =
  | { success: true }
  | { success: false; error: string };

// Upload satu item checklist bukti (Redaman/ONT/Kabel & Jalur) -- TIDAK
// mengubah status Tiket, beda dari startTiket/endTiket. Bisa dipanggil
// berkali-kali kapan saja selagi Tiket berstatus "dikerjakan"; End-nya
// sendiri (endTiketWithEvidence) yang mengecek semua item sudah lengkap.
export async function uploadTiketEvidenceFoto(
  client: SupabaseClient,
  input: UploadTiketEvidenceFotoInput
): Promise<UploadTiketEvidenceFotoResult> {
  const path = `${input.tiketId}/${input.type}-${Date.now()}.jpg`;
  const { error: uploadError } = await client.storage
    .from(PHOTO_BUCKET)
    .upload(path, input.photoBlob, { contentType: "image/jpeg" });

  if (uploadError) {
    return { success: false, error: "Gagal mengunggah foto. Coba lagi." };
  }

  const {
    data: { publicUrl },
  } = client.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  const { error: fotoError } = await client.from("tiket_foto").insert({
    tiket_id: input.tiketId,
    type: input.type,
    url: publicUrl,
    path,
    uploaded_by: input.uploadedBy,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  });

  if (fotoError) {
    return { success: false, error: "Gagal menyimpan data foto. Coba lagi." };
  }

  return { success: true };
}
