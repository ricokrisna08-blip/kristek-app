import type { SupabaseClient } from "@supabase/supabase-js";
import { resumeTiketFromPending } from "../resumeTiketFromPending";

function fakeClient(opts: {
  tiketStatus: string;
  pendingStartedAt?: string | null;
  accumulatedPendingSeconds?: number;
  updateTiket: jest.Mock;
  insertStatusLog?: jest.Mock;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    status: opts.tiketStatus,
                    pending_started_at: opts.pendingStartedAt ?? null,
                    accumulated_pending_seconds: opts.accumulatedPendingSeconds ?? 0,
                  },
                  error: null,
                }),
            }),
          }),
          update: (payload: unknown) => ({
            eq: (...args: unknown[]) => opts.updateTiket(payload, ...args),
          }),
        };
      }
      if (table === "tiket_status_log") {
        return { insert: opts.insertStatusLog ?? jest.fn().mockResolvedValue({ error: null }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("Lanjut resumes Tiket to Dikerjakan and accumulates the elapsed Pending time", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const insertStatusLog = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "pending",
    pendingStartedAt: "2026-08-06T10:00:00.000Z",
    accumulatedPendingSeconds: 60,
    updateTiket,
    insertStatusLog,
  });

  const result = await resumeTiketFromPending(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
    now: new Date("2026-08-06T10:05:30.000Z"),
  });

  expect(updateTiket).toHaveBeenCalledWith(
    {
      status: "dikerjakan",
      pending_started_at: null,
      accumulated_pending_seconds: 60 + 330,
    },
    "id",
    "tiket-1"
  );
  expect(insertStatusLog).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    status: "dikerjakan",
    changed_by: "teknisi-1",
    notes: null,
  });
  expect(result).toEqual({ success: true });
});

test("Lanjut is rejected when the Tiket isn't Pending", async () => {
  const updateTiket = jest.fn();
  const client = fakeClient({ tiketStatus: "dikerjakan", updateTiket });

  const result = await resumeTiketFromPending(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Tiket harus berstatus Pending untuk bisa dilanjutkan.",
  });
});
