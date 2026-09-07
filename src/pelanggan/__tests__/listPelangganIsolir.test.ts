import type { SupabaseClient } from "@supabase/supabase-js";
import { listPelangganIsolir } from "../listPelangganIsolir";

type Row = {
  id: string;
  nama: string;
  alamat: string;
  no_hp: string;
  isolir_at?: string | null;
  wilayah?: { nama: string } | null;
  odp?: { label: string } | null;
};

function fakeClient(result: { data: Row[] | null; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(result),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("maps isolir Pelanggan rows including Wilayah/ODP labels", async () => {
  const client = fakeClient({
    data: [
      {
        id: "p1",
        nama: "Budi",
        alamat: "Jl. Mawar 1",
        no_hp: "6281111111111",
        isolir_at: "2026-09-01T03:00:00.000Z",
        wilayah: { nama: "Wilayah A" },
        odp: { label: "ODP-KRTK-001" },
      },
    ],
    error: null,
  });

  const result = await listPelangganIsolir(client);

  expect(result).toEqual([
    {
      id: "p1",
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      noHp: "6281111111111",
      wilayahNama: "Wilayah A",
      odpLabel: "ODP-KRTK-001",
      isolirAt: "2026-09-01T03:00:00.000Z",
    },
  ]);
});

test("missing Wilayah/ODP/isolir_at fall back to null", async () => {
  const client = fakeClient({
    data: [{ id: "p1", nama: "Budi", alamat: "Jl. Mawar 1", no_hp: "6281111111111" }],
    error: null,
  });

  const result = await listPelangganIsolir(client);

  expect(result).toEqual([
    {
      id: "p1",
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      noHp: "6281111111111",
      wilayahNama: null,
      odpLabel: null,
      isolirAt: null,
    },
  ]);
});

test("returns an empty array instead of throwing on query error", async () => {
  const client = fakeClient({ data: null, error: { message: "db error" } });

  const result = await listPelangganIsolir(client);

  expect(result).toEqual([]);
});
