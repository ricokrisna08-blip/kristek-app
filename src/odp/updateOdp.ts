import type { SupabaseClient } from "@supabase/supabase-js";

export type UpdateOdpInput = {
  label: string;
  lokasi: string;
  wilayahId: string;
};

export type UpdateOdpResult = { success: true } | { success: false; error: string };

export async function updateOdp(
  client: SupabaseClient,
  id: string,
  input: UpdateOdpInput
): Promise<UpdateOdpResult> {
  const { error } = await client
    .from("odp")
    .update({
      label: input.label,
      lokasi: input.lokasi,
      wilayah_id: input.wilayahId,
    })
    .eq("id", id);

  if (error) {
    const isDuplicateLabel = (error as { code?: string }).code === "23505";
    return {
      success: false,
      error: isDuplicateLabel
        ? "Label ODP sudah dipakai"
        : "Gagal menyimpan perubahan ODP. Coba lagi.",
    };
  }

  return { success: true };
}
