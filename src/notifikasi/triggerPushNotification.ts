import type { SupabaseClient } from "@supabase/supabase-js";

// Dipanggil abis insert ke tabel notifikasi berhasil, dari 4 titik insert
// (createTiketWithAssignment.ts, setTiketPending.ts, endTiket.ts,
// submitPengajuanCuti.ts). Fire-and-forget dengan sengaja -- badge lonceng
// in-app sudah jalan lewat Realtime subscription begitu row notifikasi
// ke-insert, jadi kalau push notification-nya gagal terkirim (device belum
// register, Expo/VAPID lagi down, dll), itu tidak boleh mengganggu alur
// utama (assign Tiket, submit cuti, dst) atau bikin badge lonceng telat.
export function triggerPushNotification(client: SupabaseClient, notifikasiId: string): void {
  client.functions
    .invoke("send-push-notification", {
      body: { record: { id: notifikasiId } },
    })
    .catch((err) => {
      console.warn("Gagal memicu push notification:", err);
    });
}
