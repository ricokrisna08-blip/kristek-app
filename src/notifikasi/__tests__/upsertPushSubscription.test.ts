import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertPushSubscription } from "../upsertPushSubscription";

function fakeClient(upsertResult: { error: unknown }) {
  const upsert = jest.fn(() => Promise.resolve(upsertResult));
  const client = {
    from: () => ({ upsert }),
  } as unknown as SupabaseClient;
  return { client, upsert };
}

test("upserts an Expo push token keyed on expo_push_token", async () => {
  const { client, upsert } = fakeClient({ error: null });

  const result = await upsertPushSubscription(client, {
    platform: "expo",
    userId: "user-1",
    expoPushToken: "ExponentPushToken[abc]",
  });

  expect(result).toEqual({ success: true });
  expect(upsert).toHaveBeenCalledWith(
    {
      user_id: "user-1",
      platform: "expo",
      expo_push_token: "ExponentPushToken[abc]",
    },
    { onConflict: "expo_push_token" }
  );
});

test("upserts a web push subscription keyed on web_endpoint", async () => {
  const { client, upsert } = fakeClient({ error: null });

  const result = await upsertPushSubscription(client, {
    platform: "web",
    userId: "user-1",
    webEndpoint: "https://push.example.com/abc",
    webP256dh: "p256dh-key",
    webAuth: "auth-key",
  });

  expect(result).toEqual({ success: true });
  expect(upsert).toHaveBeenCalledWith(
    {
      user_id: "user-1",
      platform: "web",
      web_endpoint: "https://push.example.com/abc",
      web_p256dh: "p256dh-key",
      web_auth: "auth-key",
    },
    { onConflict: "web_endpoint" }
  );
});

test("an upsert failure returns a clear error instead of crashing", async () => {
  const { client } = fakeClient({ error: { code: "42501", message: "permission denied" } });

  const result = await upsertPushSubscription(client, {
    platform: "expo",
    userId: "user-1",
    expoPushToken: "ExponentPushToken[abc]",
  });

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan langganan notifikasi.",
  });
});
