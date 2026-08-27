import type { SupabaseClient } from "@supabase/supabase-js";
import { listBelumBayarUntukWaBlast } from "../listBelumBayarUntukWaBlast";

type Row = {
  id: string;
  nama: string;
  harga: number | null;
  tagihan_prorata?: number | null;
  kompensasi_nominal?: number | null;
  sudah_diblast_bulan_ini: boolean;
};

function fakeClient(rows: Row[]): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("maps rows and computes effective tagihan (prorata basis, minus kompensasi)", async () => {
  const client = fakeClient([
    { id: "p1", nama: "Budi", harga: 165000, sudah_diblast_bulan_ini: false },
    {
      id: "p2",
      nama: "Siti",
      harga: 165000,
      kompensasi_nominal: 50000,
      sudah_diblast_bulan_ini: true,
    },
  ]);

  const result = await listBelumBayarUntukWaBlast(client);

  expect(result).toEqual([
    { id: "p1", nama: "Budi", tagihan: 165000, sudahDiblastBulanIni: false },
    { id: "p2", nama: "Siti", tagihan: 115000, sudahDiblastBulanIni: true },
  ]);
});

test("excludes Pelanggan whose effective tagihan is 0", async () => {
  const client = fakeClient([
    { id: "p1", nama: "Benefit", harga: 0, sudah_diblast_bulan_ini: false },
  ]);

  const result = await listBelumBayarUntukWaBlast(client);

  expect(result).toEqual([]);
});

test("returns an empty array instead of throwing on query error", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: null, error: { message: "db error" } }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  const result = await listBelumBayarUntukWaBlast(client);

  expect(result).toEqual([]);
});
