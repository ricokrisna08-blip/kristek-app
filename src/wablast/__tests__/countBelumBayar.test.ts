import type { SupabaseClient } from "@supabase/supabase-js";
import { countBelumBayar } from "../countBelumBayar";

function fakeClient(
  rows: Array<{ harga: number | null; tagihan_prorata: number | null }>
): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: rows, error: null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("counts Pelanggan with a normal positive harga", async () => {
  const client = fakeClient([
    { harga: 165000, tagihan_prorata: null },
    { harga: 200000, tagihan_prorata: null },
  ]);

  const result = await countBelumBayar(client);

  expect(result).toBe(2);
});

test("excludes Pelanggan whose effective tagihan is 0 (e.g. Benefit with harga 0)", async () => {
  const client = fakeClient([
    { harga: 165000, tagihan_prorata: null },
    { harga: 0, tagihan_prorata: null },
    { harga: null, tagihan_prorata: null },
  ]);

  const result = await countBelumBayar(client);

  expect(result).toBe(1);
});

test("counts a Benefit Pelanggan whose harga was manually set above 0 by Pemilik", async () => {
  const client = fakeClient([{ harga: 50000, tagihan_prorata: null }]);

  const result = await countBelumBayar(client);

  expect(result).toBe(1);
});

test("prefers tagihan_prorata over harga when both are set", async () => {
  const client = fakeClient([{ harga: 165000, tagihan_prorata: 0 }]);

  const result = await countBelumBayar(client);

  expect(result).toBe(0);
});

test("returns 0 instead of throwing when the query returns no rows", async () => {
  const client = fakeClient([]);

  const result = await countBelumBayar(client);

  expect(result).toBe(0);
});
