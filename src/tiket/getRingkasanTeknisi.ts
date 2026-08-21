import type { SupabaseClient } from "@supabase/supabase-js";

export type RingkasanTeknisi = {
  baru: number;
  progress: number;
  selesaiBulanIni: number;
};

const STATUS_PROGRESS = ["dikerjakan", "pending"];

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// RLS pada tiket sudah membatasi Teknisi cuma bisa baca Tiket yang
// ditugaskan ke mereka sendiri (lihat migration 0006), jadi count di sini
// otomatis terbatas ke Tiket milik Teknisi yang login -- tidak perlu
// filter teknisi_id manual.
export async function getRingkasanTeknisi(
  client: SupabaseClient
): Promise<RingkasanTeknisi> {
  const [baruResult, progressResult, selesaiResult] = await Promise.all([
    client
      .from("tiket")
      .select("id", { count: "exact", head: true })
      .eq("status", "ditugaskan"),
    client
      .from("tiket")
      .select("id", { count: "exact", head: true })
      .in("status", STATUS_PROGRESS),
    client
      .from("tiket")
      .select("id", { count: "exact", head: true })
      .eq("status", "selesai")
      .gte("ended_at", startOfCurrentMonthIso()),
  ]);

  return {
    baru: baruResult.count ?? 0,
    progress: progressResult.count ?? 0,
    selesaiBulanIni: selesaiResult.count ?? 0,
  };
}
