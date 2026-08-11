import type { SupabaseClient } from "@supabase/supabase-js";

export type NewOdpInput = {
  label: string;
  lokasi: string;
  wilayahId: string;
};

export type OdpRecord = {
  id: string;
  label: string;
  lokasi: string;
  wilayahId: string;
};

export type CreateOdpResult =
  | { success: true; odp: OdpRecord }
  | { success: false; error: string };

export async function createOdp(
  client: SupabaseClient,
  input: NewOdpInput
): Promise<CreateOdpResult> {
  const { data, error } = await client
    .from("odp")
    .insert({
      label: input.label,
      lokasi: input.lokasi,
      wilayah_id: input.wilayahId,
    })
    .select()
    .single();

  if (error || !data) {
    const isDuplicateLabel = (error as { code?: string } | null)?.code === "23505";
    return {
      success: false,
      error: isDuplicateLabel
        ? "Label ODP sudah dipakai"
        : "Gagal menambah ODP. Coba lagi.",
    };
  }

  return {
    success: true,
    odp: {
      id: data.id,
      label: data.label,
      lokasi: data.lokasi,
      wilayahId: data.wilayah_id,
    },
  };
}
