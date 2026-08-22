import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTeknisiPerformance, type TeknisiPerformance } from "./computeTeknisiPerformance";

export async function getTeknisiPerformance(
  client: SupabaseClient
): Promise<TeknisiPerformance[]> {
  const [teknisiResult, assignmentResult, tiketResult, pendingResult] = await Promise.all([
    client.from("users").select("id, nama").eq("role", "teknisi").order("nama"),
    client.from("tiket_teknisi").select("tiket_id, teknisi_id, teknisi_nama_snapshot"),
    client
      .from("tiket")
      .select("id, status, started_at, ended_at, accumulated_pending_seconds"),
    client.from("tiket_status_log").select("tiket_id").eq("status", "pending"),
  ]);

  // Teknisi aktif dulu, lalu tambahkan teknisi yang akunnya sudah dihapus
  // tapi masih punya histori assignment -- pakai nama snapshot-nya, biar
  // baris performa mereka tidak lenyap dari laporan.
  const teknisiList = (teknisiResult.data ?? []).map((row: any) => ({
    id: row.id,
    nama: row.nama,
  }));
  const activeTeknisiIds = new Set(teknisiList.map((t) => t.id));
  for (const row of assignmentResult.data ?? []) {
    if (!activeTeknisiIds.has(row.teknisi_id)) {
      activeTeknisiIds.add(row.teknisi_id);
      teknisiList.push({
        id: row.teknisi_id,
        nama: row.teknisi_nama_snapshot ?? "Teknisi (akun dihapus)",
      });
    }
  }

  const assignments = (assignmentResult.data ?? []).map((row: any) => ({
    tiketId: row.tiket_id,
    teknisiId: row.teknisi_id,
  }));

  const tikets = (tiketResult.data ?? []).map((row: any) => ({
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    accumulatedPendingSeconds: row.accumulated_pending_seconds ?? 0,
  }));

  const pendingEvents = (pendingResult.data ?? []).map((row: any) => ({
    tiketId: row.tiket_id,
  }));

  return computeTeknisiPerformance({ teknisiList, assignments, tikets, pendingEvents });
}
