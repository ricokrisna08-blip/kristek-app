import type { SupabaseClient } from "@supabase/supabase-js";
import { listBelumBayarUntukDc } from "../listBelumBayarUntukDc";

type Row = {
  id: string;
  nama: string;
  alamat: string;
  no_hp?: string;
  catatan?: string | null;
  harga: number | null;
  tagihan_prorata?: number | null;
  kompensasi_nominal?: number | null;
  dc_flagged_lunas: boolean;
  dc_flagged_by?: string | null;
  prioritas_dc?: boolean;
};

function fakeClient(rows: Row[]): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("maps rows and computes effective tagihan (prorata basis, minus kompensasi)", async () => {
  const client = fakeClient([
    {
      id: "p1",
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      no_hp: "6281111111111",
      catatan: "Rumah cat biru",
      harga: 165000,
      dc_flagged_lunas: false,
      prioritas_dc: false,
    },
    {
      id: "p2",
      nama: "Siti",
      alamat: "Jl. Melati 2",
      no_hp: "6282222222222",
      harga: 165000,
      kompensasi_nominal: 50000,
      dc_flagged_lunas: false,
      prioritas_dc: false,
    },
  ]);

  const result = await listBelumBayarUntukDc(client, "dc-1");

  expect(result).toEqual([
    {
      id: "p1",
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      noHp: "6281111111111",
      catatan: "Rumah cat biru",
      tagihan: 165000,
      dcFlaggedLunas: false,
      dcFlaggedByMe: false,
      prioritasDc: false,
    },
    {
      id: "p2",
      nama: "Siti",
      alamat: "Jl. Melati 2",
      noHp: "6282222222222",
      catatan: null,
      tagihan: 115000,
      dcFlaggedLunas: false,
      dcFlaggedByMe: false,
      prioritasDc: false,
    },
  ]);
});

test("excludes Pelanggan whose effective tagihan is 0", async () => {
  const client = fakeClient([
    { id: "p1", nama: "Benefit", alamat: "Jl. Benefit", harga: 0, dc_flagged_lunas: false },
  ]);

  const result = await listBelumBayarUntukDc(client, "dc-1");

  expect(result).toEqual([]);
});

test("dcFlaggedByMe is true only when the flag belongs to the current DC user", async () => {
  const client = fakeClient([
    { id: "p1", nama: "Budi", alamat: "A", harga: 100000, dc_flagged_lunas: true, dc_flagged_by: "dc-1" },
    { id: "p2", nama: "Siti", alamat: "B", harga: 100000, dc_flagged_lunas: true, dc_flagged_by: "dc-2" },
  ]);

  const result = await listBelumBayarUntukDc(client, "dc-1");

  expect(result[0]).toMatchObject({ dcFlaggedLunas: true, dcFlaggedByMe: true });
  expect(result[1]).toMatchObject({ dcFlaggedLunas: true, dcFlaggedByMe: false });
});

test("returns an empty array instead of throwing on query error", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => Promise.resolve({ data: null, error: { message: "db error" } }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  const result = await listBelumBayarUntukDc(client, "dc-1");

  expect(result).toEqual([]);
});

test("prioritas Pelanggan are mapped from prioritas_dc", async () => {
  const client = fakeClient([
    { id: "p1", nama: "Budi", alamat: "A", harga: 100000, dc_flagged_lunas: false, prioritas_dc: true },
    { id: "p2", nama: "Siti", alamat: "B", harga: 100000, dc_flagged_lunas: false, prioritas_dc: false },
  ]);

  const result = await listBelumBayarUntukDc(client, "dc-1");

  expect(result[0]).toMatchObject({ prioritasDc: true });
  expect(result[1]).toMatchObject({ prioritasDc: false });
});
