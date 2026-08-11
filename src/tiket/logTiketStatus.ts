import type { SupabaseClient } from "@supabase/supabase-js";
import type { TiketStatus } from "./stateMachine/applyTiketEvent";

export async function logTiketStatus(
  client: SupabaseClient,
  input: {
    tiketId: string;
    status: TiketStatus;
    changedBy: string;
    notes?: string;
  }
): Promise<void> {
  await client.from("tiket_status_log").insert({
    tiket_id: input.tiketId,
    status: input.status,
    changed_by: input.changedBy,
    notes: input.notes ?? null,
  });
}
