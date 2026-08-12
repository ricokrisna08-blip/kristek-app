import type { SupabaseClient } from "@supabase/supabase-js";

export type UpdatePelangganHargaResult =
  | { success: true }
  | { success: false; error: string };

export async function updatePelangganHarga(
  client: SupabaseClient,
  id: string,
  harga: number
): Promise<UpdatePelangganHargaResult> {
  const { error } = await client.from("pelanggan").update({ harga }).eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan harga. Coba lagi." };
  }

  return { success: true };
}
