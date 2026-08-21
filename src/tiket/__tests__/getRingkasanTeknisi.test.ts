import type { SupabaseClient } from "@supabase/supabase-js";
import { getRingkasanTeknisi } from "../getRingkasanTeknisi";

function fakeClient(counts: {
  baru: number | null;
  progress: number | null;
  selesai: number | null;
}): SupabaseClient {
  let selectCall = 0;
  return {
    from: () => ({
      select: () => {
        selectCall += 1;
        const isBaruQuery = selectCall === 1;
        return {
          eq: () =>
            isBaruQuery
              ? Promise.resolve({ count: counts.baru, error: null })
              : { gte: () => Promise.resolve({ count: counts.selesai, error: null }) },
          in: () => Promise.resolve({ count: counts.progress, error: null }),
        };
      },
    }),
  } as unknown as SupabaseClient;
}

test("returns all three counts from the three queries", async () => {
  const client = fakeClient({ baru: 2, progress: 3, selesai: 12 });

  const result = await getRingkasanTeknisi(client);

  expect(result).toEqual({ baru: 2, progress: 3, selesaiBulanIni: 12 });
});

test("defaults to 0 instead of null when a count comes back empty", async () => {
  const client = fakeClient({ baru: null, progress: null, selesai: null });

  const result = await getRingkasanTeknisi(client);

  expect(result).toEqual({ baru: 0, progress: 0, selesaiBulanIni: 0 });
});
