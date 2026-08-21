import type { SupabaseClient } from "@supabase/supabase-js";

export type UpsertPushSubscriptionResult =
  | { success: true }
  | { success: false; error: string };

export type ExpoPushSubscriptionInput = {
  platform: "expo";
  userId: string;
  expoPushToken: string;
};

export type WebPushSubscriptionInput = {
  platform: "web";
  userId: string;
  webEndpoint: string;
  webP256dh: string;
  webAuth: string;
};

export type PushSubscriptionInput = ExpoPushSubscriptionInput | WebPushSubscriptionInput;

// Unique index-nya di kolom token/endpoint sendiri (bukan user_id + token),
// jadi kalau device yang sama dipakai login user lain, onConflict di sini
// bikin baris lama "pindah tangan" ke user_id yang baru -- bukan numpuk
// jadi 2 baris yang sama-sama dapat push ke device itu.
export async function upsertPushSubscription(
  client: SupabaseClient,
  input: PushSubscriptionInput
): Promise<UpsertPushSubscriptionResult> {
  const { error } =
    input.platform === "expo"
      ? await client.from("push_subscriptions").upsert(
          {
            user_id: input.userId,
            platform: "expo",
            expo_push_token: input.expoPushToken,
          },
          { onConflict: "expo_push_token" }
        )
      : await client.from("push_subscriptions").upsert(
          {
            user_id: input.userId,
            platform: "web",
            web_endpoint: input.webEndpoint,
            web_p256dh: input.webP256dh,
            web_auth: input.webAuth,
          },
          { onConflict: "web_endpoint" }
        );

  if (error) {
    return { success: false, error: "Gagal menyimpan langganan notifikasi." };
  }

  return { success: true };
}
