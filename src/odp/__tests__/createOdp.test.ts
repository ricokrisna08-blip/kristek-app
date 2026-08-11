import type { SupabaseClient } from "@supabase/supabase-js";
import { createOdp } from "../createOdp";

function fakeClient(insertResult: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve(insertResult),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("valid input creates a new ODP", async () => {
  const client = fakeClient({
    data: {
      id: "odp-1",
      label: "ODP-KRTK-001",
      lokasi: "Jl. Melati Raya",
      wilayah_id: "wilayah-1",
    },
    error: null,
  });

  const result = await createOdp(client, {
    label: "ODP-KRTK-001",
    lokasi: "Jl. Melati Raya",
    wilayahId: "wilayah-1",
  });

  expect(result).toEqual({
    success: true,
    odp: {
      id: "odp-1",
      label: "ODP-KRTK-001",
      lokasi: "Jl. Melati Raya",
      wilayahId: "wilayah-1",
    },
  });
});

test("a duplicate label surfaces a clear error instead of a raw DB error", async () => {
  const client = fakeClient({
    data: null,
    error: {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    },
  });

  const result = await createOdp(client, {
    label: "ODP-KRTK-001",
    lokasi: "Jl. Melati Raya 2",
    wilayahId: "wilayah-1",
  });

  expect(result).toEqual({ success: false, error: "Label ODP sudah dipakai" });
});
