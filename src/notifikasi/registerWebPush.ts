import type { SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { upsertPushSubscription } from "./upsertPushSubscription";

// Web-only -- expo-notifications tidak support web, jadi jalur ini pakai
// Web Push API standar (Service Worker + VAPID) lewat public/sw.js.
export async function registerWebPush(client: SupabaseClient, userId: string): Promise<void> {
  if (Platform.OS !== "web") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (typeof window === "undefined" || !("PushManager" in window)) return;

  const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await upsertPushSubscription(client, {
      platform: "web",
      userId,
      webEndpoint: json.endpoint,
      webP256dh: json.keys.p256dh,
      webAuth: json.keys.auth,
    });
  } catch (err) {
    // Registrasi push notification tidak boleh mengganggu alur login --
    // gagal diam-diam (mis. izin ditolak, browser tidak support) sudah
    // cukup ditangani lewat early return di atas.
    console.warn("Gagal mendaftarkan push notification (Web):", err);
  }
}

// PushManager.subscribe butuh applicationServerKey dalam bentuk
// Uint8Array, tapi VAPID public key disimpan/didistribusikan sebagai
// base64url string -- konversi standar, lihat MDN Push API docs.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
