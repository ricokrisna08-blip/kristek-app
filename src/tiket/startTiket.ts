import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTiketEvent, type TiketStatus } from "./stateMachine/applyTiketEvent";
import { logTiketStatus } from "./logTiketStatus";

const PHOTO_BUCKET = "tiket-foto";

export type StartTiketInput = {
  tiketId: string;
  uploadedBy: string;
  photoBlob: Blob;
  latitude?: number | null;
  longitude?: number | null;
};

export type StartTiketResult =
  | { success: true }
  | { success: false; error: string };

export async function startTiket(
  client: SupabaseClient,
  input: StartTiketInput
): Promise<StartTiketResult> {
  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  const machineResult = applyTiketEvent(
    { status: tiket.status as TiketStatus },
    { type: "start", hasBeforePhoto: true }
  );

  if (!machineResult.valid) {
    return { success: false, error: machineResult.error };
  }

  const path = `${input.tiketId}/before-${Date.now()}.jpg`;
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
    type: "before",
    url: publicUrl,
    path,
    uploaded_by: input.uploadedBy,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  });

  if (fotoError) {
    return { success: false, error: "Gagal menyimpan data foto. Coba lagi." };
  }

  const { error: updateError } = await client
    .from("tiket")
    .update({ status: machineResult.newStatus, started_at: new Date().toISOString() })
    .eq("id", input.tiketId);

  if (updateError) {
    return { success: false, error: "Gagal mengubah status Tiket. Coba lagi." };
  }

  await logTiketStatus(client, {
    tiketId: input.tiketId,
    status: machineResult.newStatus,
    changedBy: input.uploadedBy,
  });

  return { success: true };
}
