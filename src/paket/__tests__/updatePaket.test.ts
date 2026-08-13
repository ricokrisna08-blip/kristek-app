import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePaket } from "../updatePaket";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve(updateResult),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("a valid name updates the Paket", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePaket(client, "paket-1", "50 Mbps");

  expect(result).toEqual({ success: true });
});

test("an empty (or whitespace-only) name is rejected before hitting the server", async () => {
  const update = jest.fn();
  const client = { from: () => ({ update }) } as unknown as SupabaseClient;

  const result = await updatePaket(client, "paket-1", "   ");

  expect(update).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Nama Paket tidak boleh kosong",
  });
});

test("a duplicate name surfaces a clear error instead of a raw DB error", async () => {
  const client = fakeClient({
    error: { code: "23505", message: "duplicate key value violates unique constraint" },
  });

  const result = await updatePaket(client, "paket-1", "30 Mbps");

  expect(result).toEqual({ success: false, error: "Paket dengan nama ini sudah ada" });
});
