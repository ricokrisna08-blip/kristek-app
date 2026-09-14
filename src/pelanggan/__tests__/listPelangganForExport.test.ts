import type { SupabaseClient } from "@supabase/supabase-js";
import { listPelangganForExport } from "../listPelangganForExport";

type Row = {
  nama: string;
  alamat: string;
  no_hp: string;
  harga: number | null;
  is_active: boolean;
  is_isolir: boolean;
  paket?: { nama: string } | null;
};

function fakeClient(result: { data: Row[] | null; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve(result),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("maps Pelanggan rows including Paket name", async () => {
  const client = fakeClient({
    data: [
      {
        nama: "Budi",
        alamat: "Jl. Mawar 1",
        no_hp: "6281111111111",
        harga: 165000,
        is_active: true,
        is_isolir: false,
        paket: { nama: "Paket 10 Mbps" },
      },
    ],
    error: null,
  });

  const result = await listPelangganForExport(client);

  expect(result).toEqual([
    {
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      paketNama: "Paket 10 Mbps",
      harga: 165000,
      noHp: "6281111111111",
      status: "Aktif",
    },
  ]);
});

test("status is Nonaktif when is_active is false, regardless of isolir", async () => {
  const client = fakeClient({
    data: [
      {
        nama: "Budi",
        alamat: "A",
        no_hp: "1",
        harga: 100000,
        is_active: false,
        is_isolir: true,
      },
    ],
    error: null,
  });

  const result = await listPelangganForExport(client);

  expect(result[0].status).toBe("Nonaktif");
});

test("status is Isolir when active but currently isolir", async () => {
  const client = fakeClient({
    data: [
      { nama: "Siti", alamat: "B", no_hp: "2", harga: 100000, is_active: true, is_isolir: true },
    ],
    error: null,
  });

  const result = await listPelangganForExport(client);

  expect(result[0].status).toBe("Isolir");
});

test("missing Paket falls back to null", async () => {
  const client = fakeClient({
    data: [
      { nama: "Budi", alamat: "A", no_hp: "1", harga: null, is_active: true, is_isolir: false },
    ],
    error: null,
  });

  const result = await listPelangganForExport(client);

  expect(result[0]).toMatchObject({ paketNama: null, harga: null });
});

test("returns an empty array instead of throwing on query error", async () => {
  const client = fakeClient({ data: null, error: { message: "db error" } });

  const result = await listPelangganForExport(client);

  expect(result).toEqual([]);
});
