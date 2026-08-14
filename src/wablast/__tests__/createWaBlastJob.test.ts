import type { SupabaseClient } from "@supabase/supabase-js";
import { createWaBlastJob } from "../createWaBlastJob";

function fakeClient(result: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve(result),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("returns the new job id on success", async () => {
  const client = fakeClient({ data: { id: "job-1" }, error: null });

  const result = await createWaBlastJob(client, "user-1");

  expect(result).toEqual({ success: true, jobId: "job-1" });
});

test("returns a clear error on failure", async () => {
  const client = fakeClient({ data: null, error: { message: "permission denied" } });

  const result = await createWaBlastJob(client, "user-1");

  expect(result).toEqual({ success: false, error: "Gagal membuat job blast. Coba lagi." });
});
