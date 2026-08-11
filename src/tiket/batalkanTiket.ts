import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTiketEvent, type TiketStatus } from "./stateMachine/applyTiketEvent";
import { logTiketStatus } from "./logTiketStatus";

export type BatalkanTiketInput = {
  tiketId: string;
  cancelledBy: string;
};

export type BatalkanTiketResult =
  | { success: true }
  | { success: false; error: string };

export async function batalkanTiket(
  client: SupabaseClient,
  input: BatalkanTiketInput
): Promise<BatalkanTiketResult> {
  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  const machineResult = applyTiketEvent(
    { status: tiket.status as TiketStatus },
    { type: "batalkan" }
  );

  if (!machineResult.valid) {
    return { success: false, error: machineResult.error };
  }

  const { error: updateError } = await client
    .from("tiket")
    .update({ status: machineResult.newStatus, dibatalkan_by: input.cancelledBy })
    .eq("id", input.tiketId);

  if (updateError) {
    return { success: false, error: "Gagal membatalkan Tiket. Coba lagi." };
  }

  await logTiketStatus(client, {
    tiketId: input.tiketId,
    status: machineResult.newStatus,
    changedBy: input.cancelledBy,
  });

  return { success: true };
}
