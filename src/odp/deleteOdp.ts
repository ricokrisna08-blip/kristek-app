import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteOdpResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteOdp(
  client: SupabaseClient,
  id: string
): Promise<DeleteOdpResult> {
  const { error } = await client.from("odp").delete().eq("id", id);

  if (error) {
    const isInUse = (error as { code?: string }).code === "23503";
    return {
      success: false,
      error: isInUse
        ? "ODP ini masih dipakai (Pelanggan/Tiket), tidak bisa dihapus."
        : "Gagal menghapus ODP. Coba lagi.",
    };
  }

  return { success: true };
}
