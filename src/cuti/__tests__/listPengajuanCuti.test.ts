import type { SupabaseClient } from "@supabase/supabase-js";
import { listPengajuanCuti } from "../listPengajuanCuti";

function fakeClient(data: unknown): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data, error: null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("maps joined teknisi nama and snake_case columns to the app shape", async () => {
  const client = fakeClient([
    {
      id: "cuti-1",
      tanggal_mulai: "2026-08-20",
      tanggal_selesai: "2026-08-22",
      alasan: "Sakit demam",
      created_at: "2026-08-13T00:00:00.000Z",
      teknisi: { nama: "Ahmad Wahyudi" },
    },
  ]);

  const result = await listPengajuanCuti(client);

  expect(result).toEqual([
    {
      id: "cuti-1",
      teknisiNama: "Ahmad Wahyudi",
      tanggalMulai: "2026-08-20",
      tanggalSelesai: "2026-08-22",
      alasan: "Sakit demam",
      createdAt: "2026-08-13T00:00:00.000Z",
    },
  ]);
});

test("falls back to a placeholder name when the teknisi join is missing", async () => {
  const client = fakeClient([
    {
      id: "cuti-1",
      tanggal_mulai: "2026-08-20",
      tanggal_selesai: "2026-08-22",
      alasan: "Sakit demam",
      created_at: "2026-08-13T00:00:00.000Z",
      teknisi: null,
    },
  ]);

  const result = await listPengajuanCuti(client);

  expect(result[0].teknisiNama).toBe("Teknisi tidak diketahui");
});

test("an error from the query returns an empty list instead of throwing", async () => {
  const client = {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: { message: "db error" } }),
      }),
    }),
  } as unknown as SupabaseClient;

  const result = await listPengajuanCuti(client);

  expect(result).toEqual([]);
});
