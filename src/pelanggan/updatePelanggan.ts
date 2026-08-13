import type { SupabaseClient } from "@supabase/supabase-js";

export type UpdatePelangganInput = {
  nama: string;
  alamat: string;
  noHp: string;
  odpId: string;
  wilayahId: string;
  paketId: string;
};

export type UpdatePelangganResult =
  | { success: true }
  | { success: false; error: string };

export async function updatePelanggan(
  client: SupabaseClient,
  id: string,
  input: UpdatePelangganInput
): Promise<UpdatePelangganResult> {
  const { error } = await client
    .from("pelanggan")
    .update({
      nama: input.nama,
      alamat: input.alamat,
      no_hp: input.noHp,
      odp_id: input.odpId,
      wilayah_id: input.wilayahId,
      paket_id: input.paketId,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan perubahan Pelanggan. Coba lagi." };
  }

  return { success: true };
}
