import type { SupabaseClient } from "@supabase/supabase-js";
import { getTeknisiPerformance } from "../getTeknisiPerformance";

function fakeClient(options: {
  activeTeknisi: { id: string; nama: string }[];
  assignments: { tiket_id: string; teknisi_id: string; teknisi_nama_snapshot: string | null }[];
  tikets: {
    id: string;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    accumulated_pending_seconds: number;
  }[];
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: options.activeTeknisi, error: null }),
            }),
          }),
        };
      }
      if (table === "tiket_teknisi") {
        return {
          select: () => Promise.resolve({ data: options.assignments, error: null }),
        };
      }
      if (table === "tiket") {
        return {
          select: () => Promise.resolve({ data: options.tikets, error: null }),
        };
      }
      if (table === "tiket_status_log") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("includes a Teknisi whose account was deleted, using their name snapshot", async () => {
  const client = fakeClient({
    activeTeknisi: [{ id: "teknisi-1", nama: "Budi" }],
    assignments: [
      { tiket_id: "tiket-1", teknisi_id: "teknisi-1", teknisi_nama_snapshot: "Budi" },
      { tiket_id: "tiket-2", teknisi_id: "teknisi-2", teknisi_nama_snapshot: "Siti (dihapus)" },
    ],
    tikets: [
      {
        id: "tiket-1",
        status: "selesai",
        started_at: "2026-08-01T10:00:00.000Z",
        ended_at: "2026-08-01T11:00:00.000Z",
        accumulated_pending_seconds: 0,
      },
      {
        id: "tiket-2",
        status: "selesai",
        started_at: "2026-08-02T10:00:00.000Z",
        ended_at: "2026-08-02T11:00:00.000Z",
        accumulated_pending_seconds: 0,
      },
    ],
  });

  const result = await getTeknisiPerformance(client);

  expect(result).toHaveLength(2);
  expect(result.find((r) => r.teknisiId === "teknisi-1")?.namaTeknisi).toBe("Budi");
  const deleted = result.find((r) => r.teknisiId === "teknisi-2");
  expect(deleted?.namaTeknisi).toBe("Siti (dihapus)");
  expect(deleted?.jumlahTiketSelesai).toBe(1);
});

test("falls back to a placeholder name when a deleted Teknisi has no snapshot (pre-existing row)", async () => {
  const client = fakeClient({
    activeTeknisi: [],
    assignments: [
      { tiket_id: "tiket-1", teknisi_id: "teknisi-9", teknisi_nama_snapshot: null },
    ],
    tikets: [
      {
        id: "tiket-1",
        status: "selesai",
        started_at: "2026-08-01T10:00:00.000Z",
        ended_at: "2026-08-01T11:00:00.000Z",
        accumulated_pending_seconds: 0,
      },
    ],
  });

  const result = await getTeknisiPerformance(client);

  expect(result).toEqual([
    expect.objectContaining({ teknisiId: "teknisi-9", namaTeknisi: "Teknisi (akun dihapus)" }),
  ]);
});
