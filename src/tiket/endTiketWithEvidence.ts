import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTiketEvent, type TiketStatus } from "./stateMachine/applyTiketEvent";
import { logTiketStatus } from "./logTiketStatus";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";
import { generateUuid } from "../lib/generateUuid";
import {
  computeEvidenceStatus,
  isEvidenceComplete,
  requiresEvidenceChecklist,
} from "./instalasiEvidence";

export type EndTiketWithEvidenceInput = {
  tiketId: string;
  changedBy: string;
};

export type EndTiketWithEvidenceResult =
  | { success: true }
  | { success: false; error: string };

// End untuk Tiket Instalasi & Laporan Pelanggan -- beda dari endTiket.ts
// (Maintenance), di sini TIDAK ada foto yang diambil saat End itu
// sendiri. Checklist bukti (Redaman/ONT/Kabel & Jalur/Lokasi) sudah
// diupload satu-satu sebelumnya lewat uploadTiketEvidenceFoto /
// captureTiketEvidenceLokasi -- function ini cuma verifikasi ULANG di
// server (jangan percaya client) semuanya sudah lengkap, lalu finalize
// status.
export async function endTiketWithEvidence(
  client: SupabaseClient,
  input: EndTiketWithEvidenceInput
): Promise<EndTiketWithEvidenceResult> {
  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status, jenis, created_by, evidence_lokasi_latitude")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  if (!requiresEvidenceChecklist(tiket.jenis)) {
    return {
      success: false,
      error: "Jenis Tiket ini tidak memakai checklist bukti Instalasi.",
    };
  }

  const { data: fotoRows } = await client
    .from("tiket_foto")
    .select("type")
    .eq("tiket_id", input.tiketId);

  const status = computeEvidenceStatus({
    fotoTypes: (fotoRows ?? []).map((row: { type: string }) => row.type),
    hasLokasi: tiket.evidence_lokasi_latitude != null,
  });

  if (!isEvidenceComplete(status)) {
    return {
      success: false,
      error:
        "Checklist bukti belum lengkap (Foto Redaman, Foto ONT, Foto Kabel & Jalur, Lokasi rumah pelanggan).",
    };
  }

  const machineResult = applyTiketEvent(
    { status: tiket.status as TiketStatus },
    { type: "end", hasAfterPhoto: true }
  );

  if (!machineResult.valid) {
    return { success: false, error: machineResult.error };
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
    changedBy: input.changedBy,
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
