import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTiketEvent, type TiketStatus } from "./stateMachine/applyTiketEvent";
import { logTiketStatus } from "./logTiketStatus";

export type ResumeTiketFromPendingInput = {
  tiketId: string;
  changedBy: string;
  now?: Date;
};

export type ResumeTiketFromPendingResult =
  | { success: true }
  | { success: false; error: string };

export async function resumeTiketFromPending(
  client: SupabaseClient,
  input: ResumeTiketFromPendingInput
): Promise<ResumeTiketFromPendingResult> {
  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status, pending_started_at, accumulated_pending_seconds")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  const machineResult = applyTiketEvent(
    { status: tiket.status as TiketStatus },
    { type: "lanjut" }
  );

  if (!machineResult.valid) {
    return { success: false, error: machineResult.error };
  }

  const now = input.now ?? new Date();
  const pendingStartedAt = tiket.pending_started_at
    ? new Date(tiket.pending_started_at)
    : now;
  const elapsedSeconds = Math.max(
    0,
    Math.round((now.getTime() - pendingStartedAt.getTime()) / 1000)
  );
  const newAccumulatedSeconds =
    (tiket.accumulated_pending_seconds ?? 0) + elapsedSeconds;

  const { error: updateError } = await client
    .from("tiket")
    .update({
      status: machineResult.newStatus,
      pending_started_at: null,
      accumulated_pending_seconds: newAccumulatedSeconds,
    })
    .eq("id", input.tiketId);

  if (updateError) {
    return { success: false, error: "Gagal mengubah status Tiket. Coba lagi." };
  }

  await logTiketStatus(client, {
    tiketId: input.tiketId,
    status: machineResult.newStatus,
    changedBy: input.changedBy,
  });

  return { success: true };
}
