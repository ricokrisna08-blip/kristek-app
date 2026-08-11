import type { SupabaseClient } from "@supabase/supabase-js";

export type TiketListItem = {
  id: string;
  jenis: string;
  status: string;
  pelangganNama: string | null;
  odpLabel: string | null;
  createdAt: string;
};

export async function listTiket(client: SupabaseClient): Promise<TiketListItem[]> {
  const { data, error } = await client
    .from("tiket")
    .select(
      "id, jenis, status, created_at, pelanggan:pelanggan_id (nama), odp:odp_id (label)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    jenis: row.jenis,
    status: row.status,
    pelangganNama: row.pelanggan?.nama ?? null,
    odpLabel: row.odp?.label ?? null,
    createdAt: row.created_at,
  }));
}
