import type { SupabaseClient } from "@supabase/supabase-js";
import { createWaBlastJob } from "../createWaBlastJob";

function fakeClient(result: { data: unknown; error: unknown }) {
  const insertCalls: unknown[] = [];

  const client = {
    from: () => ({
      insert: (row: unknown) => {
        insertCalls.push(row);
        return {
          select: () => ({
            single: () => Promise.resolve(result),
          }),
        };
      },
    }),
  } as unknown as SupabaseClient;

  return { client, insertCalls };
}

test("returns the new job id on success", async () => {
  const { client } = fakeClient({ data: { id: "job-1" }, error: null });

  const result = await createWaBlastJob(client, "user-1");

  expect(result).toEqual({ success: true, jobId: "job-1" });
});

test("returns a clear error on failure", async () => {
  const { client } = fakeClient({ data: null, error: { message: "permission denied" } });

  const result = await createWaBlastJob(client, "user-1");

  expect(result).toEqual({ success: false, error: "Gagal membuat job blast. Coba lagi." });
});

test("without pelangganIds, inserts pelanggan_ids as null (blast-penuh mode)", async () => {
  const { client, insertCalls } = fakeClient({ data: { id: "job-1" }, error: null });

  await createWaBlastJob(client, "user-1");

  expect(insertCalls).toEqual([
    { mode: "billing", requested_by: "user-1", pelanggan_ids: null },
  ]);
});

test("with pelangganIds, inserts them so the job only targets those Pelanggan", async () => {
  const { client, insertCalls } = fakeClient({ data: { id: "job-1" }, error: null });

  await createWaBlastJob(client, "user-1", ["p1", "p2"]);

  expect(insertCalls).toEqual([
    { mode: "billing", requested_by: "user-1", pelanggan_ids: ["p1", "p2"] },
  ]);
});
