import type { SupabaseClient } from "@supabase/supabase-js";
import { isTiketFotoExpired } from "./tiketFotoExpiry";

export type TiketFoto = {
  id: string;
  type: "before" | "after";
  url: string;
  path: string;
  uploadedAt: string;
};

export async function listTiketFoto(
  client: SupabaseClient,
  tiketId: string,
  now: Date = new Date()
): Promise<TiketFoto[]> {
  const { data, error } = await client
    .from("tiket_foto")
    .select("id, type, url, path, uploaded_at")
    .eq("tiket_id", tiketId)
    .order("uploaded_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .filter((row: any) => !isTiketFotoExpired(row.uploaded_at, now))
    .map((row: any) => ({
      id: row.id,
      type: row.type,
      url: row.url,
      path: row.path,
      uploadedAt: row.uploaded_at,
    }));
}
