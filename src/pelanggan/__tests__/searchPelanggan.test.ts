import type { SupabaseClient } from "@supabase/supabase-js";
import { searchPelanggan } from "../searchPelanggan";

function fakeClient(or: (filter: string) => any): SupabaseClient {
  return {
    from: () => ({
      select: () => ({ or }),
    }),
  } as unknown as SupabaseClient;
}

test("searches by Nama OR Nomor Pelanggan using the query as-is on both fields", async () => {
  const order = jest.fn().mockResolvedValue({ data: [], error: null });
  const or = jest.fn().mockReturnValue({ order });
  const client = fakeClient(or);

  await searchPelanggan(client, "Budi");

  expect(or).toHaveBeenCalledWith(
    "nama.ilike.%Budi%,nomor_pelanggan.ilike.%Budi%"
  );
});
