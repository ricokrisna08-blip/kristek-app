import type { SupabaseClient } from "@supabase/supabase-js";

export function subscribeToNotifikasi(
  client: SupabaseClient,
  userId: string,
  onChange: () => void
) {
  const channel = client
    .channel(`notifikasi-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifikasi",
        filter: `user_id=eq.${userId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
