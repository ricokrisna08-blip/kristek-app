import type { SupabaseClient } from "@supabase/supabase-js";

export type DeletePaketResult =
  | { success: true }
  | { success: false; error: string };

export async function deletePaket(
  client: SupabaseClient,
  id: string
): Promise<DeletePaketResult> {
  const { error } = await client.from("paket").delete().eq("id", id);

  if (error) {
    const isInUse = (error as { code?: string }).code === "23503";
    return {
      success: false,
      error: isInUse
        ? "Paket ini masih dipakai Pelanggan, tidak bisa dihapus."
        : "Gagal menghapus Paket. Coba lagi.",
    };
  }

  return { success: true };
}
