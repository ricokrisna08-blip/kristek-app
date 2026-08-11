import type { SupabaseClient } from "@supabase/supabase-js";
import { batalkanTiket } from "../batalkanTiket";

function fakeClient(opts: {
  tiketStatus: string;
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
                Promise.resolve({ data: { status: opts.tiketStatus }, error: null }),
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

test("Batalkan succeeds from a non-final status and records dibatalkan_by", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const insertStatusLog = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({ tiketStatus: "dikerjakan", updateTiket, insertStatusLog });

  const result = await batalkanTiket(client, {
    tiketId: "tiket-1",
    cancelledBy: "admin-1",
  });

  expect(updateTiket).toHaveBeenCalledWith(
    { status: "dibatalkan", dibatalkan_by: "admin-1" },
    "id",
    "tiket-1"
  );
  expect(insertStatusLog).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    status: "dibatalkan",
    changed_by: "admin-1",
    notes: null,
  });
  expect(result).toEqual({ success: true });
});

test("Batalkan is rejected when the Tiket is already Selesai, without touching the DB", async () => {
  const updateTiket = jest.fn();
  const client = fakeClient({ tiketStatus: "selesai", updateTiket });

  const result = await batalkanTiket(client, {
    tiketId: "tiket-1",
    cancelledBy: "admin-1",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Tiket yang sudah Selesai atau Dibatalkan tidak bisa dibatalkan lagi.",
  });
});
