import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteWilayahResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteWilayah(
  client: SupabaseClient,
  id: string
): Promise<DeleteWilayahResult> {
  const { error } = await client.from("wilayah").delete().eq("id", id);

  if (error) {
    const isInUse = (error as { code?: string }).code === "23503";
    return {
      success: false,
      error: isInUse
        ? "Wilayah ini masih dipakai (Akun/Pelanggan/ODP/Tiket), tidak bisa dihapus."
        : "Gagal menghapus Wilayah. Coba lagi.",
    };
  }

  return { success: true };
}
