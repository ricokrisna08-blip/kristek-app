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
