import type { SupabaseClient } from "@supabase/supabase-js";
import { isTiketFotoExpired } from "./tiketFotoExpiry";

export type TiketFoto = {
  id: string;
  type: "before" | "after" | "redaman" | "ont" | "kabel_jalur";
  url: string;
  path: string;
  uploadedAt: string;
  latitude: number | null;
  longitude: number | null;
};

export async function listTiketFoto(
  client: SupabaseClient,
  tiketId: string,
  now: Date = new Date()
): Promise<TiketFoto[]> {
  const { data, error } = await client
    .from("tiket_foto")
    .select("id, type, url, path, uploaded_at, latitude, longitude")
    .eq("tiket_id", tiketId)
    .order("uploaded_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  // Retensi 7 hari cuma berlaku buat before/after (referensi kerja
  // sementara) -- checklist bukti Instalasi/Laporan Pelanggan
  // (redaman/ont/kabel_jalur) itu arsip permanen, jangan ikut disembunyikan.
  return data
    .filter((row: any) => {
      if (row.type !== "before" && row.type !== "after") return true;
      return !isTiketFotoExpired(row.uploaded_at, now);
    })
    .map((row: any) => ({
      id: row.id,
      type: row.type,
      url: row.url,
      path: row.path,
      uploadedAt: row.uploaded_at,
      latitude: row.latitude,
      longitude: row.longitude,
    }));
}
