import type { SupabaseClient } from "@supabase/supabase-js";

export type TiketStatusLogEntry = {
  id: string;
  status: string;
  changedAt: string;
  notes: string | null;
};

export async function listTiketStatusLog(
  client: SupabaseClient,
  tiketId: string
): Promise<TiketStatusLogEntry[]> {
  const { data, error } = await client
    .from("tiket_status_log")
    .select("id, status, changed_at, notes")
    .eq("tiket_id", tiketId)
    .order("changed_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    status: row.status,
    changedAt: row.changed_at,
    notes: row.notes,
  }));
}
