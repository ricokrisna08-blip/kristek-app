import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganStatusInput = {
  isActive: boolean;
  isBenefit: boolean;
  subsidiAktif: number | null;
  prorate: boolean;
  // Harga Paket saat ini (bukan Harga Langganan Pelanggan yang mungkin
  // sudah di-override manual) -- dipakai buat hitung ulang Harga
  // Langganan = Harga Paket - Subsidi setiap kali status disimpan, sesuai
  // kebijakan Pemilik. null kalau Pelanggan-nya nggak punya Paket valid,
  // dalam hal itu Harga Langganan dibiarkan seperti apa adanya.
  paketHarga: number | null;
};

export type UpdatePelangganStatusResult =
  | { success: true; harga: number | null }
  | { success: false; error: string };

export async function updatePelangganStatus(
  client: SupabaseClient,
  id: string,
  input: PelangganStatusInput
): Promise<UpdatePelangganStatusResult> {
  const harga =
    input.paketHarga != null
      ? Math.max(input.paketHarga - (input.subsidiAktif ?? 0), 0)
      : null;

  const updatePayload: Record<string, unknown> = {
    is_active: input.isActive,
    is_benefit: input.isBenefit,
    subsidi_aktif: input.subsidiAktif,
    prorate: input.prorate,
  };
  if (harga != null) {
    updatePayload.harga = harga;
  }

  const { error } = await client.from("pelanggan").update(updatePayload).eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan status Pelanggan. Coba lagi." };
  }

  return { success: true, harga };
}
