// Edge Function: send-push-notification
//
// Dipanggil langsung dari app (src/notifikasi/triggerPushNotification.ts)
// abis insert ke public.notifikasi berhasil -- lihat 4 titik insert-nya:
// createTiketWithAssignment.ts, setTiketPending.ts, endTiket.ts,
// submitPengajuanCuti.ts. Function ini yang jadi satu titik terpusat buat
// kirim push notification, supaya notifikasi juga muncul di notification
// tray HP (Android APK & browser Web) -- bukan cuma badge lonceng in-app.
//
// Awalnya dirancang lewat Database Webhook (trigger otomatis di level DB,
// tanpa perlu diubah di 4 tempat insert itu), tapi project ini belum
// punya schema `supabase_functions` yang dibutuhkan fitur itu (gap
// provisioning platform Supabase, bukan sesuatu yang bisa di-fix dari
// migration biasa) -- jadi dipanggil langsung dari client saja.
//
// Dua jalur terpisah karena expo-notifications TIDAK support web sama
// sekali (dikonfirmasi dari docs resmi Expo):
// - Native (APK): Expo Push Token -> Expo Push API -> FCM.
// - Web: Web Push API standar (VAPID) -> push service masing-masing
//   browser, lewat public/sw.js.
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh
// SUPABASE_SERVICE_ROLE_KEY (baca push_subscriptions lintas user tanpa RLS)
// dan VAPID private key (tidak boleh ada di bundle mobile/web).
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "send-push-notification" -> paste isi file ini -> Deploy, lalu
// ikuti DEPLOY.md di folder ini untuk set secret VAPID. Tidak ada push
// yang terkirim sampai kedua langkah itu dilakukan manual.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

const JENIS_LABEL: Record<string, string> = {
  instalasi: "Instalasi",
  gangguan_komplain: "Gangguan-Komplain",
  maintenance: "Maintenance",
};

const ACTION_BY_TIKET_TYPE: Record<string, string> = {
  ditugaskan: "baru ditugaskan ke Anda",
  pending: "masuk status Pending",
  selesai: "sudah Selesai",
};

function formatTanggalPendek(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

type NotifikasiRow = {
  id: string;
  user_id: string;
  type: string;
  notes: string | null;
  tiket: { jenis: string | null; pelanggan: { nama: string } | null; odp: { label: string } | null } | null;
  cuti: {
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    teknisi: { nama: string } | null;
  } | null;
};

// Replika logic src/notifikasi/notifikasiLabel.ts -- beda runtime (RN vs
// Deno) jadi tidak bisa di-share langsung, tapi harus tetap sinkron kalau
// salah satu diubah.
function buildNotifikasiMessage(row: NotifikasiRow): { title: string; body: string } {
  if (row.type === "cuti_diajukan") {
    const nama = row.cuti?.teknisi?.nama ?? "Teknisi";
    const rentang =
      row.cuti?.tanggal_mulai && row.cuti?.tanggal_selesai
        ? `${formatTanggalPendek(row.cuti.tanggal_mulai)} - ${formatTanggalPendek(row.cuti.tanggal_selesai)}`
        : null;
    const rentangSuffix = rentang ? ` (${rentang})` : "";
    const alasanSuffix = row.notes ? ` — Alasan: ${row.notes}` : "";
    return {
      title: "KRISTEK",
      body: `${nama} mengajukan cuti/izin${rentangSuffix}${alasanSuffix}`,
    };
  }

  const jenisLabel = row.tiket?.jenis ? JENIS_LABEL[row.tiket.jenis] ?? row.tiket.jenis : "Tiket";
  const target = row.tiket?.pelanggan?.nama ?? row.tiket?.odp?.label;
  const subject = target ? `${jenisLabel} — ${target}` : jenisLabel;
  const notesSuffix = row.notes ? ` — Catatan: ${row.notes}` : "";
  const action = ACTION_BY_TIKET_TYPE[row.type] ?? "diperbarui";

  return { title: "KRISTEK", body: `${subject} ${action}${notesSuffix}` };
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<{ success: true } | { success: false; shouldRemove: boolean; error: string }> {
  try {
    const res = await fetch(EXPO_PUSH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, title, body, data }),
    });
    const json = await res.json().catch(() => null);
    const ticket = json?.data;
    if (ticket?.status === "error") {
      const errorType = ticket?.details?.error;
      return {
        success: false,
        shouldRemove: errorType === "DeviceNotRegistered",
        error: ticket?.message ?? "Expo push error",
      };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      shouldRemove: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<{ success: true } | { success: false; shouldRemove: boolean; error: string }> {
  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    return {
      success: false,
      shouldRemove: statusCode === 404 || statusCode === 410,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Sama seperti insert ke tabel notifikasi sendiri (RLS-nya "any
  // authenticated user can insert"): siapa pun user yang lagi login boleh
  // memicu push, karena penerimanya ditentukan dari notifikasi.user_id
  // (record.id), bukan dari identitas si pemanggil -- pemanggilnya sering
  // beda orang dari penerima (mis. Admin assign Tiket ke Teknisi lain).
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Sesi tidak valid" }, 401);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let payload: { record?: { id?: string; user_id?: string } };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const notifikasiId = payload.record?.id;
  if (!notifikasiId) {
    return jsonResponse({ error: "record.id tidak ada di body request" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: row, error: rowError } = await adminClient
    .from("notifikasi")
    .select(
      `id, user_id, type, notes,
       tiket:tiket_id ( jenis, pelanggan:pelanggan_id ( nama ), odp:odp_id ( label ) ),
       cuti:cuti_id ( tanggal_mulai, tanggal_selesai, teknisi:teknisi_id ( nama ) )`
    )
    .eq("id", notifikasiId)
    .single();

  if (rowError || !row) {
    return jsonResponse({ error: "Notifikasi tidak ditemukan" }, 404);
  }

  const { title, body } = buildNotifikasiMessage(row as unknown as NotifikasiRow);

  const { data: subscriptions } = await adminClient
    .from("push_subscriptions")
    .select("id, platform, expo_push_token, web_endpoint, web_p256dh, web_auth")
    .eq("user_id", row.user_id);

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");
  if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  const staleIds: string[] = [];
  const results = await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      if (sub.platform === "expo" && sub.expo_push_token) {
        const result = await sendExpoPush(sub.expo_push_token, title, body, {
          notifikasiId,
        });
        if (!result.success && result.shouldRemove) staleIds.push(sub.id);
        return { platform: "expo", ...result };
      }

      if (sub.platform === "web" && sub.web_endpoint && sub.web_p256dh && sub.web_auth) {
        if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
          return { platform: "web", success: false, shouldRemove: false, error: "VAPID belum diset" };
        }
        const result = await sendWebPush(
          {
            endpoint: sub.web_endpoint,
            keys: { p256dh: sub.web_p256dh, auth: sub.web_auth },
          },
          JSON.stringify({ title, body, data: { notifikasiId } })
        );
        if (!result.success && result.shouldRemove) staleIds.push(sub.id);
        return { platform: "web", ...result };
      }

      return { platform: sub.platform, success: false, shouldRemove: false, error: "Baris subscription tidak lengkap" };
    })
  );

  if (staleIds.length > 0) {
    await adminClient.from("push_subscriptions").delete().in("id", staleIds);
  }

  return jsonResponse({ sent: results.length, results }, 200);
});
