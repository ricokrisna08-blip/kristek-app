import type { SupabaseClient } from "@supabase/supabase-js";
import { generateUuid } from "../lib/generateUuid";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";

export type ReassignTiketTeknisiInput = {
  tiketId: string;
  teknisiIds: string[];
};

export type ReassignTiketTeknisiResult =
  | { success: true }
  | { success: false; error: string };

// Ganti Teknisi yang ditugaskan ke Tiket -- hanya boleh selama status
// masih "ditugaskan" (belum di-Start), diverifikasi ulang di sini
// (bukan cuma dipercaya dari client) dan juga dijamin oleh RLS
// tiket_teknisi (lihat migration 20260822020000).
export async function reassignTiketTeknisi(
  client: SupabaseClient,
  input: ReassignTiketTeknisiInput
): Promise<ReassignTiketTeknisiResult> {
  if (input.teknisiIds.length === 0) {
    return { success: false, error: "Pilih minimal satu Teknisi." };
  }

  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  if (tiket.status !== "ditugaskan") {
    return {
      success: false,
      error:
        "Teknisi cuma bisa diganti selagi Tiket masih berstatus Ditugaskan (belum di-Start).",
    };
  }

  const { data: existingRows } = await client
    .from("tiket_teknisi")
    .select("teknisi_id")
    .eq("tiket_id", input.tiketId);
  const existingTeknisiIds = new Set((existingRows ?? []).map((row) => row.teknisi_id));

  const { error: deleteError } = await client
    .from("tiket_teknisi")
    .delete()
    .eq("tiket_id", input.tiketId);

  if (deleteError) {
    return { success: false, error: "Gagal melepas Teknisi lama. Coba lagi." };
  }

  const { data: teknisiRows } = await client
    .from("users")
    .select("id, nama")
    .in("id", input.teknisiIds);
  const namaById = new Map((teknisiRows ?? []).map((row) => [row.id, row.nama]));

  const { error: insertError } = await client.from("tiket_teknisi").insert(
    input.teknisiIds.map((teknisiId) => ({
      tiket_id: input.tiketId,
      teknisi_id: teknisiId,
      teknisi_nama_snapshot: namaById.get(teknisiId) ?? null,
    }))
  );

  if (insertError) {
    return { success: false, error: "Gagal menugaskan Teknisi baru. Coba lagi." };
  }

  // Cuma Teknisi yang BARU ditambahkan yang dapat notifikasi "ditugaskan"
  // -- Teknisi yang sudah ada sebelumnya & tetap dipertahankan tidak
  // perlu dapat notif duplikat.
  const newlyAddedIds = input.teknisiIds.filter((id) => !existingTeknisiIds.has(id));
  if (newlyAddedIds.length > 0) {
    const notifikasiRows = newlyAddedIds.map((teknisiId) => ({
      id: generateUuid(),
      user_id: teknisiId,
      tiket_id: input.tiketId,
      type: "ditugaskan",
    }));

    const { error: notifikasiError } = await client.from("notifikasi").insert(notifikasiRows);
    if (!notifikasiError) {
      for (const row of notifikasiRows) {
        triggerPushNotification(client, row.id);
      }
    }
  }

  return { success: true };
}
