import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateWaBlastJobResult =
  | { success: true; jobId: string }
  | { success: false; error: string };

// mode selalu "billing" dari app -- marketing/apology sengaja cuma bisa
// dipicu manual lewat CLI script-nya langsung (lihat kristek-wa-blast),
// bukan lewat tombol app, karena isinya bukan komunikasi ke Pelanggan.
export async function createWaBlastJob(
  client: SupabaseClient,
  requestedBy: string
): Promise<CreateWaBlastJobResult> {
  const { data, error } = await client
    .from("wa_blast_job")
    .insert({ mode: "billing", requested_by: requestedBy })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Gagal membuat job blast. Coba lagi." };
  }

  return { success: true, jobId: data.id };
}
