import type { SupabaseClient } from "@supabase/supabase-js";
import { listPengeluaranBulanIni } from "../listPengeluaranBulanIni";

type Row = {
  id: string;
  kategori: string;
  keterangan: string;
  nominal: number | null;
  persen: number | null;
  tanggal: string;
};

function fakeClient(rows: Row[]): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        gte: () => ({
          lt: () => ({
            order: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("flat-nominal rows use nominal as-is", async () => {
  const client = fakeClient([
    { id: "p1", kategori: "Gaji", keterangan: "Gaji Awe", nominal: 1500000, persen: null, tanggal: "2026-08-27" },
  ]);

  const result = await listPengeluaranBulanIni(client, 17230757);

  expect(result[0]).toMatchObject({ nominal: 1500000, persen: null, efektif: 1500000 });
});

test("persen-based rows compute efektif from sudahBayarBulanIni, rounded", async () => {
  const client = fakeClient([
    { id: "p1", kategori: "Fee ISP", keterangan: "Fee ISP 3%", nominal: null, persen: 3, tanggal: "2026-08-27" },
  ]);

  const result = await listPengeluaranBulanIni(client, 17230757);

  // 17230757 * 0.03 = 516922.71 -> dibulatkan 516923
  expect(result[0]).toMatchObject({ nominal: null, persen: 3, efektif: 516923 });
});

test("returns an empty array instead of throwing on query error", async () => {
  const client = {
    from: () => ({
      select: () => ({
        gte: () => ({
          lt: () => ({
            order: () => Promise.resolve({ data: null, error: { message: "db error" } }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  const result = await listPengeluaranBulanIni(client, 1000000);

  expect(result).toEqual([]);
});
