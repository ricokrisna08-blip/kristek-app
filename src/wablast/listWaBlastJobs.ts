import type { SupabaseClient } from "@supabase/supabase-js";

export type WaBlastJobStatus = "pending" | "running" | "done" | "failed";

export type WaBlastJobItem = {
  id: string;
  mode: string;
  status: WaBlastJobStatus;
  total: number;
  sentCount: number;
  failedCount: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  pelangganIdsCount: number | null;
};

const RECENT_JOBS_LIMIT = 10;

export async function listWaBlastJobs(client: SupabaseClient): Promise<WaBlastJobItem[]> {
  const { data, error } = await client
    .from("wa_blast_job")
    .select(
      "id, mode, status, total, sent_count, failed_count, error, created_at, started_at, finished_at, pelanggan_ids"
    )
    .order("created_at", { ascending: false })
    .limit(RECENT_JOBS_LIMIT);

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    mode: row.mode,
    status: row.status,
    total: row.total,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    error: row.error,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    pelangganIdsCount: row.pelanggan_ids ? row.pelanggan_ids.length : null,
  }));
}
