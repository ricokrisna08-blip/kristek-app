import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueuedAction } from "./offlineQueue";
import { startTiket } from "../tiket/startTiket";
import { setTiketPending } from "../tiket/setTiketPending";
import { resumeTiketFromPending } from "../tiket/resumeTiketFromPending";
import { endTiket } from "../tiket/endTiket";

export type ProcessQueuedActionResult =
  | { success: true }
  | { success: false; error: string };

export async function processQueuedAction(
  client: SupabaseClient,
  action: QueuedAction,
  fetchPhotoBlob: (uri: string) => Promise<Blob>
): Promise<ProcessQueuedActionResult> {
  switch (action.type) {
    case "start": {
      const photoBlob = await fetchPhotoBlob(action.photoUri);
      return startTiket(client, {
        tiketId: action.tiketId,
        uploadedBy: action.uploadedBy,
        photoBlob,
        latitude: action.latitude,
        longitude: action.longitude,
      });
    }
    case "pending":
      return setTiketPending(client, {
        tiketId: action.tiketId,
        changedBy: action.changedBy,
        notes: action.notes,
      });
    case "lanjut":
      return resumeTiketFromPending(client, {
        tiketId: action.tiketId,
        changedBy: action.changedBy,
      });
    case "end": {
      const photoBlob = await fetchPhotoBlob(action.photoUri);
      return endTiket(client, {
        tiketId: action.tiketId,
        uploadedBy: action.uploadedBy,
        photoBlob,
        latitude: action.latitude,
        longitude: action.longitude,
      });
    }
  }
}
