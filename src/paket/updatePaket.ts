import type { SupabaseClient } from "@supabase/supabase-js";

export type UpdatePaketResult =
  | { success: true }
  | { success: false; error: string };

export async function updatePaket(
  client: SupabaseClient,
  id: string,
  nama: string
): Promise<UpdatePaketResult> {
  const trimmedNama = nama.trim();

  if (!trimmedNama) {
    return { success: false, error: "Nama Paket tidak boleh kosong" };
  }

  const { error } = await client.from("paket").update({ nama: trimmedNama }).eq("id", id);

  if (error) {
    const isDuplicateName = (error as { code?: string } | null)?.code === "23505";
    return {
      success: false,
      error: isDuplicateName
        ? "Paket dengan nama ini sudah ada"
        : "Gagal menyimpan Paket. Coba lagi.",
    };
  }

  return { success: true };
}
