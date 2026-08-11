import type { SupabaseClient } from "@supabase/supabase-js";

export type NotifikasiType = "ditugaskan" | "pending" | "selesai";

export type Notifikasi = {
  id: string;
  tiketId: string;
  type: NotifikasiType;
  readAt: string | null;
  createdAt: string;
  tiketJenis: string | null;
  pelangganNama: string | null;
  odpLabel: string | null;
  notes: string | null;
};

export async function listNotifikasi(
  client: SupabaseClient,
  userId: string
): Promise<Notifikasi[]> {
  const { data, error } = await client
    .from("notifikasi")
    .select(
      `id, tiket_id, type, read_at, created_at, notes,
       tiket:tiket_id ( jenis, pelanggan:pelanggan_id ( nama ), odp:odp_id ( label ) )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    tiketId: row.tiket_id,
    type: row.type,
    readAt: row.read_at,
    createdAt: row.created_at,
    notes: row.notes ?? null,
    tiketJenis: row.tiket?.jenis ?? null,
    pelangganNama: row.tiket?.pelanggan?.nama ?? null,
    odpLabel: row.tiket?.odp?.label ?? null,
  }));
}
