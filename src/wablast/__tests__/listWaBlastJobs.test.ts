import type { SupabaseClient } from "@supabase/supabase-js";
import { listWaBlastJobs } from "../listWaBlastJobs";

function fakeClient(result: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve(result),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("maps rows to camelCase items", async () => {
  const client = fakeClient({
    data: [
      {
        id: "job-1",
        mode: "billing",
        status: "running",
        total: 100,
        sent_count: 42,
        failed_count: 1,
        error: null,
        created_at: "2026-08-14T02:00:00Z",
        started_at: "2026-08-14T02:00:05Z",
        finished_at: null,
      },
    ],
    error: null,
  });

  const result = await listWaBlastJobs(client);

  expect(result).toEqual([
    {
      id: "job-1",
      mode: "billing",
      status: "running",
      total: 100,
      sentCount: 42,
      failedCount: 1,
      error: null,
      createdAt: "2026-08-14T02:00:00Z",
      startedAt: "2026-08-14T02:00:05Z",
      finishedAt: null,
    },
  ]);
});

test("returns an empty list instead of throwing on error", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await listWaBlastJobs(client);

  expect(result).toEqual([]);
});
