import type { SupabaseClient } from "@supabase/supabase-js";
import { listPengeluaranPeriode } from "../listPengeluaranPeriode";

type Row = {
  id: string;
  kategori: string;
  keterangan: string;
  nominal: number | null;
  persen: number | null;
  tanggal: string;
  sudah_dibayar: boolean;
};

function fakeClient(rows: Row[]) {
  const calls: { gte?: string; lt?: string } = {};

  const client = {
    from: () => ({
      select: () => ({
        gte: (_col: string, value: string) => {
          calls.gte = value;
          return {
            lt: (_col2: string, value2: string) => {
              calls.lt = value2;
              return { order: () => Promise.resolve({ data: rows, error: null }) };
            },
          };
        },
      }),
    }),
  } as unknown as SupabaseClient;

  return { client, calls };
}

test("flat-nominal rows use nominal as-is", async () => {
  const { client } = fakeClient([
    { id: "p1", kategori: "Gaji", keterangan: "Gaji Awe", nominal: 1500000, persen: null, tanggal: "2026-08-27", sudah_dibayar: true },
  ]);

  const result = await listPengeluaranPeriode(client, "2026-08-01", 17230757);

  expect(result[0]).toMatchObject({ nominal: 1500000, persen: null, sudahDibayar: true, efektif: 1500000 });
});

test("persen-based rows compute efektif from sudahBayarPeriode, rounded", async () => {
  const { client } = fakeClient([
    { id: "p1", kategori: "Fee ISP", keterangan: "Fee ISP 3%", nominal: null, persen: 3, tanggal: "2026-08-27", sudah_dibayar: false },
  ]);

  const result = await listPengeluaranPeriode(client, "2026-08-01", 17230757);

  // 17230757 * 0.03 = 516922.71 -> dibulatkan 516923
  expect(result[0]).toMatchObject({ nominal: null, persen: 3, sudahDibayar: false, efektif: 516923 });
});

test("queries the exact calendar-month range for the given periode, computed from the string (no UTC shift)", async () => {
  const { client, calls } = fakeClient([]);

  await listPengeluaranPeriode(client, "2026-08-01", 0);

  expect(calls).toEqual({ gte: "2026-08-01", lt: "2026-09-01" });
});

test("rolls over the year when the periode is December", async () => {
  const { client, calls } = fakeClient([]);

  await listPengeluaranPeriode(client, "2026-12-01", 0);

  expect(calls).toEqual({ gte: "2026-12-01", lt: "2027-01-01" });
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

  const result = await listPengeluaranPeriode(client, "2026-08-01", 1000000);

  expect(result).toEqual([]);
});
