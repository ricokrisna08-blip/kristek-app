import type { SupabaseClient } from "@supabase/supabase-js";
import { getRingkasanTeknisi } from "../getRingkasanTeknisi";

function fakeClient(counts: { aktif: number; selesai: number }): SupabaseClient {
  let call = 0;
  return {
    from: () => ({
      select: () => {
        call += 1;
        const isFirstCall = call === 1;
        return {
          in: () => Promise.resolve({ count: counts.aktif, error: null }),
          eq: () => ({
            gte: () => Promise.resolve({ count: counts.selesai, error: null }),
          }),
        };
      },
    }),
  } as unknown as SupabaseClient;
}

test("returns both counts from the two queries", async () => {
  const client = fakeClient({ aktif: 3, selesai: 12 });

  const result = await getRingkasanTeknisi(client);

  expect(result).toEqual({ tugasAktif: 3, selesaiBulanIni: 12 });
});

test("defaults to 0 instead of null when a count comes back empty", async () => {
  const client = {
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ count: null, error: null }),
        eq: () => ({
          gte: () => Promise.resolve({ count: null, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  const result = await getRingkasanTeknisi(client);

  expect(result).toEqual({ tugasAktif: 0, selesaiBulanIni: 0 });
});
