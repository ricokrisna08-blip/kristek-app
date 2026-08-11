import type { SupabaseClient } from "@supabase/supabase-js";
import { createWilayah } from "../createWilayah";

function fakeClient(
  insertResult: { data: unknown; error: unknown }
): SupabaseClient {
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

test("a valid name creates a new Wilayah", async () => {
  const client = fakeClient({
    data: { id: "wilayah-1", nama: "Kelurahan Baru" },
    error: null,
  });

  const result = await createWilayah(client, "Kelurahan Baru");

  expect(result).toEqual({
    success: true,
    wilayah: { id: "wilayah-1", nama: "Kelurahan Baru" },
  });
});

test("an empty (or whitespace-only) name is rejected before hitting the server", async () => {
  const insert = jest.fn();
  const client = {
    from: () => ({ insert }),
  } as unknown as SupabaseClient;

  const result = await createWilayah(client, "   ");

  expect(insert).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Nama Wilayah tidak boleh kosong",
  });
});
