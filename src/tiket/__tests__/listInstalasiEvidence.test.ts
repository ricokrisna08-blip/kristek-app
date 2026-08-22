import type { SupabaseClient } from "@supabase/supabase-js";
import { listInstalasiEvidence } from "../listInstalasiEvidence";

function fakeClient(options: {
  tikets: unknown[];
  fotos: { tiket_id: string; type: string }[];
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket") {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: options.tikets, error: null }),
            }),
          }),
        };
      }
      if (table === "tiket_foto") {
        return {
          select: () => ({
            in: () => ({
              in: () => Promise.resolve({ data: options.fotos, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("counts evidence checklist completion (Redaman/ONT/Kabel & Jalur/Lokasi) out of 4", async () => {
  const client = fakeClient({
    tikets: [
      {
        id: "tiket-1",
        created_at: "2026-08-18T08:00:00.000Z",
        started_at: "2026-08-18T08:05:00.000Z",
        ended_at: null,
        evidence_lokasi_latitude: -6.2,
        pelanggan: { nama: "Budi Santoso", nomor_pelanggan: "KRTK-000922" },
      },
    ],
    fotos: [
      { tiket_id: "tiket-1", type: "redaman" },
      { tiket_id: "tiket-1", type: "ont" },
    ],
  });

  const result = await listInstalasiEvidence(client);

  expect(result).toEqual([
    {
      id: "tiket-1",
      pelangganNama: "Budi Santoso",
      nomorPelanggan: "KRTK-000922",
      evidenceCount: 3, // redaman + ont + lokasi, belum kabel_jalur
      updatedAt: "2026-08-18T08:05:00.000Z",
    },
  ]);
});

test("a Tiket with no evidence yet has evidenceCount 0", async () => {
  const client = fakeClient({
    tikets: [
      {
        id: "tiket-2",
        created_at: "2026-08-18T08:00:00.000Z",
        started_at: null,
        ended_at: null,
        evidence_lokasi_latitude: null,
        pelanggan: { nama: "Siti Aminah", nomor_pelanggan: "KRTK-000955" },
      },
    ],
    fotos: [],
  });

  const result = await listInstalasiEvidence(client);

  expect(result[0].evidenceCount).toBe(0);
  expect(result[0].updatedAt).toBe("2026-08-18T08:00:00.000Z");
});

test("a Tiket with all 4 evidence items complete has evidenceCount 4", async () => {
  const client = fakeClient({
    tikets: [
      {
        id: "tiket-3",
        created_at: "2026-08-18T08:00:00.000Z",
        started_at: "2026-08-18T08:05:00.000Z",
        ended_at: "2026-08-18T09:00:00.000Z",
        evidence_lokasi_latitude: -6.2,
        pelanggan: { nama: "Rahmat Hidayat", nomor_pelanggan: "KRTK-000961" },
      },
    ],
    fotos: [
      { tiket_id: "tiket-3", type: "redaman" },
      { tiket_id: "tiket-3", type: "ont" },
      { tiket_id: "tiket-3", type: "kabel_jalur" },
    ],
  });

  const result = await listInstalasiEvidence(client);

  expect(result[0].evidenceCount).toBe(4);
});

test("falls back to a placeholder when the Pelanggan join is missing", async () => {
  const client = fakeClient({
    tikets: [
      {
        id: "tiket-4",
        created_at: "2026-08-18T08:00:00.000Z",
        started_at: null,
        ended_at: null,
        evidence_lokasi_latitude: null,
        pelanggan: null,
      },
    ],
    fotos: [],
  });

  const result = await listInstalasiEvidence(client);

  expect(result[0].pelangganNama).toBe("Pelanggan tidak diketahui");
  expect(result[0].nomorPelanggan).toBe("-");
});
