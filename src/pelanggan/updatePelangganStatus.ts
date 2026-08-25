import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganStatusInput = {
  isActive: boolean;
  isBenefit: boolean;
  subsidiAktif: number | null;
  prorate: boolean;
};

export type UpdatePelangganStatusResult =
  | { success: true }
  | { success: false; error: string };

// Subsidi Aktif di sini murni catatan kebijakan Pemilik -- TIDAK
// menimpa Harga Langganan. Harga Paket cuma default awal saat Pelanggan
// dibuat (lihat createPelanggan.ts); begitu Pelanggan sudah ada, Harga
// Langganan harus tetap bisa diedit bebas lewat "Edit Harga Langganan"
// tanpa ketimpa ulang oleh Subsidi/Paket.
export async function updatePelangganStatus(
  client: SupabaseClient,
  id: string,
  input: PelangganStatusInput
): Promise<UpdatePelangganStatusResult> {
  const { error } = await client
    .from("pelanggan")
    .update({
      is_active: input.isActive,
      is_benefit: input.isBenefit,
      subsidi_aktif: input.subsidiAktif,
      prorate: input.prorate,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan status Pelanggan. Coba lagi." };
  }

  return { success: true };
}
