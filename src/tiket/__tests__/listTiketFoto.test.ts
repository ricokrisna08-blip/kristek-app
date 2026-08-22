import type { SupabaseClient } from "@supabase/supabase-js";
import { listTiketFoto } from "../listTiketFoto";

function fakeClient(rows: unknown[]): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket_foto") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: rows, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("returns photos within the 7-day retention window", async () => {
  const client = fakeClient([
    {
      id: "foto-1",
      type: "before",
      url: "https://example.test/before.jpg",
      path: "tiket-1/before-1.jpg",
      uploaded_at: "2026-08-06T00:00:00.000Z",
      latitude: -6.2,
      longitude: 106.8,
    },
  ]);

  const result = await listTiketFoto(client, "tiket-1", new Date("2026-08-07T00:00:00.000Z"));

  expect(result).toEqual([
    {
      id: "foto-1",
      type: "before",
      url: "https://example.test/before.jpg",
      path: "tiket-1/before-1.jpg",
      uploadedAt: "2026-08-06T00:00:00.000Z",
      latitude: -6.2,
      longitude: 106.8,
    },
  ]);
});

test("keeps evidence checklist photos (redaman/ont/kabel_jalur) even past 7 days -- they're a permanent record, not a work-session reference", async () => {
  const client = fakeClient([
    {
      id: "foto-redaman",
      type: "redaman",
      url: "https://example.test/redaman.jpg",
      path: "tiket-1/redaman-1.jpg",
      uploaded_at: "2026-07-01T00:00:00.000Z",
      latitude: null,
      longitude: null,
    },
  ]);

  const result = await listTiketFoto(client, "tiket-1", new Date("2026-08-07T00:00:00.000Z"));

  expect(result).toHaveLength(1);
  expect(result[0].type).toBe("redaman");
});

test("excludes photos older than 7 days", async () => {
  const client = fakeClient([
    {
      id: "foto-old",
      type: "before",
      url: "https://example.test/old.jpg",
      path: "tiket-1/before-old.jpg",
      uploaded_at: "2026-07-01T00:00:00.000Z",
      latitude: null,
      longitude: null,
    },
    {
      id: "foto-fresh",
      type: "after",
      url: "https://example.test/fresh.jpg",
      path: "tiket-1/after-fresh.jpg",
      uploaded_at: "2026-08-06T00:00:00.000Z",
      latitude: null,
      longitude: null,
    },
  ]);

  const result = await listTiketFoto(client, "tiket-1", new Date("2026-08-07T00:00:00.000Z"));

  expect(result).toEqual([
    {
      id: "foto-fresh",
      type: "after",
      url: "https://example.test/fresh.jpg",
      path: "tiket-1/after-fresh.jpg",
      uploadedAt: "2026-08-06T00:00:00.000Z",
      latitude: null,
      longitude: null,
    },
  ]);
});
