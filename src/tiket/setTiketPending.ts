import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTiketEvent, type TiketStatus } from "./stateMachine/applyTiketEvent";
import { logTiketStatus } from "./logTiketStatus";

export type SetTiketPendingInput = {
  tiketId: string;
  changedBy: string;
  notes: string;
};

export type SetTiketPendingResult =
  | { success: true }
  | { success: false; error: string };

export async function setTiketPending(
  client: SupabaseClient,
  input: SetTiketPendingInput
): Promise<SetTiketPendingResult> {
  const { data: tiket, error: fetchError } = await client
    .from("tiket")
    .select("status, created_by")
    .eq("id", input.tiketId)
    .single();

  if (fetchError || !tiket) {
    return { success: false, error: "Tiket tidak ditemukan." };
  }

  const machineResult = applyTiketEvent(
    { status: tiket.status as TiketStatus },
    { type: "pending", notes: input.notes }
  );

  if (!machineResult.valid) {
    return { success: false, error: machineResult.error };
  }

  const { error: updateError } = await client
    .from("tiket")
    .update({
      status: machineResult.newStatus,
      pending_started_at: new Date().toISOString(),
    })
    .eq("id", input.tiketId);

  if (updateError) {
    return { success: false, error: "Gagal mengubah status Tiket. Coba lagi." };
  }

  await logTiketStatus(client, {
    tiketId: input.tiketId,
    status: machineResult.newStatus,
    changedBy: input.changedBy,
    notes: input.notes,
  });

  const { data: pemilikUsers } = await client
    .from("users")
    .select("id")
    .eq("role", "pemilik");

  const notifyUserIds = new Set<string>([
    tiket.created_by,
    ...(pemilikUsers ?? []).map((u: { id: string }) => u.id),
  ]);

  await client.from("notifikasi").insert(
    Array.from(notifyUserIds).map((userId) => ({
      user_id: userId,
      tiket_id: input.tiketId,
      type: "pending",
      notes: input.notes,
    }))
  );

  return { success: true };
}
