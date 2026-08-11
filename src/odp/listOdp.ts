import type { SupabaseClient } from "@supabase/supabase-js";

export type OdpListItem = {
  id: string;
  label: string;
  lokasi: string;
  wilayahNama: string | null;
};

export async function listOdp(client: SupabaseClient): Promise<OdpListItem[]> {
  const { data, error } = await client
    .from("odp")
    .select("id, label, lokasi, wilayah:wilayah_id (nama)")
    .order("label");

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    label: row.label,
    lokasi: row.lokasi,
    wilayahNama: row.wilayah?.nama ?? null,
  }));
}
