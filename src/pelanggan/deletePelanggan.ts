import type { SupabaseClient } from "@supabase/supabase-js";

export type DeletePelangganResult =
  | { success: true }
  | { success: false; error: string };

export async function deletePelanggan(
  client: SupabaseClient,
  id: string
): Promise<DeletePelangganResult> {
  const { error } = await client.from("pelanggan").delete().eq("id", id);

  if (error) {
    const isInUse = (error as { code?: string }).code === "23503";
    return {
      success: false,
      error: isInUse
        ? "Pelanggan ini masih punya riwayat Tiket, tidak bisa dihapus."
        : "Gagal menghapus Pelanggan. Coba lagi.",
    };
  }

  return { success: true };
}
