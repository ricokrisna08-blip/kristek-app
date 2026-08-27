import type { SupabaseClient } from "@supabase/supabase-js";
import { generateUuid } from "../lib/generateUuid";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";

export type FlagLunasByDcResult = { success: true } | { success: false; error: string };

export async function flagLunasByDc(
  client: SupabaseClient,
  pelangganId: string,
  flagged: boolean
): Promise<FlagLunasByDcResult> {
  const { error } = await client.rpc("dc_flag_pelanggan_lunas", {
    p_pelanggan_id: pelangganId,
    p_flagged: flagged,
  });

  if (error) {
    return { success: false, error: error.message || "Gagal menyimpan status setoran." };
  }

  // Cuma notifikasi Pemilik waktu DC NYENTANG (butuh approval) -- batal
  // centang tidak perlu notif baru.
  if (flagged) {
    const { data: pemilikRows } = await client.from("users").select("id").eq("role", "pemilik");

    if (pemilikRows && pemilikRows.length > 0) {
      const notifikasiRows = pemilikRows.map((user: { id: string }) => ({
        id: generateUuid(),
        user_id: user.id,
        pelanggan_id: pelangganId,
        type: "setoran_dc",
      }));

      const { error: notifikasiError } = await client.from("notifikasi").insert(notifikasiRows);

      if (!notifikasiError) {
        for (const row of notifikasiRows) {
          triggerPushNotification(client, row.id);
        }
      }
    }
  }

  return { success: true };
}
