import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTiketEvent, type TiketStatus } from "./stateMachine/applyTiketEvent";
import { logTiketStatus } from "./logTiketStatus";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";
import { generateUuid } from "../lib/generateUuid";

const PHOTO_BUCKET = "tiket-foto";

export type EndTiketInput = {
  tiketId: string;
  uploadedBy: string;
  photoBlob: Blob;
  latitude?: number | null;
  longitude?: number | null;
};

export type EndTiketResult =
  | { success: true }
  | { success: false; error: string };

export async function endTiket(
  client: SupabaseClient,
  input: EndTiketInput
): Promise<EndTiketResult> {
  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status, created_by")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  const machineResult = applyTiketEvent(
    { status: tiket.status as TiketStatus },
    { type: "end", hasAfterPhoto: true }
  );

  if (!machineResult.valid) {
    return { success: false, error: machineResult.error };
  }

  const path = `${input.tiketId}/after-${Date.now()}.jpg`;
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
    type: "after",
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
    .update({ status: machineResult.newStatus, ended_at: new Date().toISOString() })
    .eq("id", input.tiketId);

  if (updateError) {
    return { success: false, error: "Gagal mengubah status Tiket. Coba lagi." };
  }

  await logTiketStatus(client, {
    tiketId: input.tiketId,
    status: machineResult.newStatus,
    changedBy: input.uploadedBy,
  });

  const { data: pemilikUsers } = await client
    .from("users")
    .select("id")
    .eq("role", "pemilik");

  const notifyUserIds = new Set<string>([
    tiket.created_by,
    ...(pemilikUsers ?? []).map((u: { id: string }) => u.id),
  ]);

  const notifikasiRows = Array.from(notifyUserIds).map((userId) => ({
    id: generateUuid(),
    user_id: userId,
    tiket_id: input.tiketId,
    type: "selesai",
  }));

  const { error: notifikasiError } = await client.from("notifikasi").insert(notifikasiRows);

  if (!notifikasiError) {
    for (const row of notifikasiRows) {
      triggerPushNotification(client, row.id);
    }
  }

  return { success: true };
}
