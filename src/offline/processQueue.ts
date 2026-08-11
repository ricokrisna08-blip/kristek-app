import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueuedAction } from "./offlineQueue";
import { processQueuedAction } from "./processQueuedAction";

export type ProcessQueueResult = {
  remainingQueue: QueuedAction[];
  failures: { action: QueuedAction; error: string }[];
};

export async function processQueue(
  client: SupabaseClient,
  queue: QueuedAction[],
  fetchPhotoBlob: (uri: string) => Promise<Blob>
): Promise<ProcessQueueResult> {
  const remainingQueue: QueuedAction[] = [];
  const failures: { action: QueuedAction; error: string }[] = [];

  for (const action of queue) {
    const result = await processQueuedAction(client, action, fetchPhotoBlob);
    if (!result.success) {
      remainingQueue.push(action);
      failures.push({ action, error: result.error });
    }
  }

  return { remainingQueue, failures };
}
