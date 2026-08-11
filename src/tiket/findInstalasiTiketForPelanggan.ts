import type { SupabaseClient } from "@supabase/supabase-js";

export async function findInstalasiTiketForPelanggan(
  client: SupabaseClient,
  pelangganId: string
): Promise<string | null> {
  const { data, error } = await client
    .from("tiket")
    .select("id")
    .eq("pelanggan_id", pelangganId)
    .eq("jenis", "instalasi")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}
