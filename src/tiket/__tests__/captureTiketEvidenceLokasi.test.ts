import type { SupabaseClient } from "@supabase/supabase-js";
import { captureTiketEvidenceLokasi } from "../captureTiketEvidenceLokasi";

function fakeClient(updateTiket: jest.Mock): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          update: (payload: unknown) => ({
            eq: (...args: unknown[]) => updateTiket(payload, ...args),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("saves the GPS coordinates and a capture timestamp onto the Tiket", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient(updateTiket);

  const result = await captureTiketEvidenceLokasi(client, {
    tiketId: "tiket-1",
    latitude: -6.2,
    longitude: 106.8,
  });

  expect(updateTiket).toHaveBeenCalledWith(
    expect.objectContaining({
      evidence_lokasi_latitude: -6.2,
      evidence_lokasi_longitude: 106.8,
      evidence_lokasi_captured_at: expect.any(String),
    }),
    "id",
    "tiket-1"
  );
  expect(result).toEqual({ success: true });
});

test("a DB error returns a clear message instead of crashing", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: { message: "db error" } });
  const client = fakeClient(updateTiket);

  const result = await captureTiketEvidenceLokasi(client, {
    tiketId: "tiket-1",
    latitude: -6.2,
    longitude: 106.8,
  });

  expect(result).toEqual({ success: false, error: "Gagal menyimpan lokasi. Coba lagi." });
});
