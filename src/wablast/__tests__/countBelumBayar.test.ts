import type { SupabaseClient } from "@supabase/supabase-js";
import { countBelumBayar } from "../countBelumBayar";

function fakeClient(count: number | null): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("returns the count from the query", async () => {
  const client = fakeClient(37);

  const result = await countBelumBayar(client);

  expect(result).toBe(37);
});

test("defaults to 0 instead of null", async () => {
  const client = fakeClient(null);

  const result = await countBelumBayar(client);

  expect(result).toBe(0);
});
