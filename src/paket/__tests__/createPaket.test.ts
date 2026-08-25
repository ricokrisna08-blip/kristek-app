import type { SupabaseClient } from "@supabase/supabase-js";
import { createPaket } from "../createPaket";

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

test("a valid name and harga creates a new Paket", async () => {
  const client = fakeClient({
    data: { id: "paket-1", nama: "30 Mbps", harga: 200000 },
    error: null,
  });

  const result = await createPaket(client, "30 Mbps", 200000);

  expect(result).toEqual({
    success: true,
    paket: { id: "paket-1", nama: "30 Mbps", harga: 200000 },
  });
});

test("an empty (or whitespace-only) name is rejected before hitting the server", async () => {
  const insert = jest.fn();
  const client = { from: () => ({ insert }) } as unknown as SupabaseClient;

  const result = await createPaket(client, "   ", null);

  expect(insert).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Nama Paket tidak boleh kosong",
  });
});

test("a duplicate name surfaces a clear error instead of a raw DB error", async () => {
  const client = fakeClient({
    data: null,
    error: { code: "23505", message: "duplicate key value violates unique constraint" },
  });

  const result = await createPaket(client, "30 Mbps", 200000);

  expect(result).toEqual({ success: false, error: "Paket dengan nama ini sudah ada" });
});
