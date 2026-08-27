import type { SupabaseClient } from "@supabase/supabase-js";
import { listPendingSetoranDc } from "../listPendingSetoranDc";

type Row = {
  id: string;
  nama: string;
  alamat: string;
  harga: number | null;
  tagihan_prorata?: number | null;
  kompensasi_nominal?: number | null;
  dc_flagged_at: string;
  dcFlaggedBy?: { nama: string } | null;
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

test("maps pending rows with the flagging DC's name and effective tagihan", async () => {
  const client = fakeClient([
    {
      id: "p1",
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      harga: 165000,
      kompensasi_nominal: 50000,
      dc_flagged_at: "2026-08-27T10:00:00Z",
      dcFlaggedBy: { nama: "Joko" },
    },
  ]);

  const result = await listPendingSetoranDc(client);

  expect(result).toEqual([
    {
      id: "p1",
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      tagihan: 115000,
      dcNama: "Joko",
      flaggedAt: "2026-08-27T10:00:00Z",
    },
  ]);
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

  const result = await listPendingSetoranDc(client);

  expect(result).toEqual([]);
});
