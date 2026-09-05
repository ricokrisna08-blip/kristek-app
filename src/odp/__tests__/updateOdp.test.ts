import type { SupabaseClient } from "@supabase/supabase-js";
import { updateOdp } from "../updateOdp";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve(updateResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("valid input updates an existing ODP", async () => {
  const client = fakeClient({ error: null });

  const result = await updateOdp(client, "odp-1", {
    label: "ODP-KRTK-001",
    lokasi: "Jl. Melati Raya",
    wilayahId: "wilayah-1",
  });

  expect(result).toEqual({ success: true });
});

test("a duplicate label surfaces a clear error instead of a raw DB error", async () => {
  const client = fakeClient({
    error: { code: "23505", message: "duplicate key value violates unique constraint" },
  });

  const result = await updateOdp(client, "odp-1", {
    label: "ODP-KRTK-001",
    lokasi: "Jl. Melati Raya 2",
    wilayahId: "wilayah-1",
  });

  expect(result).toEqual({ success: false, error: "Label ODP sudah dipakai" });
});

test("an unexpected error surfaces a generic message", async () => {
  const client = fakeClient({ error: { code: "500", message: "boom" } });

  const result = await updateOdp(client, "odp-1", {
    label: "ODP-KRTK-001",
    lokasi: "Jl. Melati Raya",
    wilayahId: "wilayah-1",
  });

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan perubahan ODP. Coba lagi.",
  });
});
