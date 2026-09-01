import type { SupabaseClient } from "@supabase/supabase-js";

export type SetPrioritasDcResult = { success: true } | { success: false; error: string };

export async function setPrioritasDc(
  client: SupabaseClient,
  pelangganId: string,
  prioritas: boolean
): Promise<SetPrioritasDcResult> {
  const { error } = await client
    .from("pelanggan")
    .update({ prioritas_dc: prioritas })
    .eq("id", pelangganId);

  if (error) {
    return { success: false, error: "Gagal menyimpan status prioritas. Coba lagi." };
  }

  return { success: true };
}
