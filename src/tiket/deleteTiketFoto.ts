import type { SupabaseClient } from "@supabase/supabase-js";

const PHOTO_BUCKET = "tiket-foto";

export type DeleteTiketFotoResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteTiketFoto(
  client: SupabaseClient,
  fotoId: string
): Promise<DeleteTiketFotoResult> {
  const { data: foto, error: fetchError } = await client
    .from("tiket_foto")
    .select("path")
    .eq("id", fotoId)
    .single();

  if (fetchError || !foto) {
    return { success: false, error: "Foto tidak ditemukan." };
  }

  const { error: removeError } = await client.storage
    .from(PHOTO_BUCKET)
    .remove([foto.path]);

  if (removeError) {
    return { success: false, error: "Gagal menghapus foto. Coba lagi." };
  }

  const { error: deleteError } = await client
    .from("tiket_foto")
    .delete()
    .eq("id", fotoId);

  if (deleteError) {
    return { success: false, error: "Gagal menghapus foto. Coba lagi." };
  }

  return { success: true };
}
