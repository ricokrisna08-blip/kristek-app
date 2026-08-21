import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertPushSubscription } from "./upsertPushSubscription";

// Native-only (Android/iOS) -- expo-notifications tidak support web sama
// sekali, lihat src/notifikasi/registerWebPush.ts untuk jalur web.
export async function registerExpoPush(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    await upsertPushSubscription(client, {
      platform: "expo",
      userId,
      expoPushToken,
    });
  } catch (err) {
    // Registrasi push notification tidak boleh mengganggu alur login --
    // gagal diam-diam (mis. izin ditolak, device tidak support) sudah cukup
    // ditangani lewat early return di atas; ini jaring pengaman terakhir.
    console.warn("Gagal mendaftarkan push notification (Expo):", err);
  }
}
