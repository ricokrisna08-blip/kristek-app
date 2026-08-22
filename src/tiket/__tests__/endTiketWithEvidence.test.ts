import type { SupabaseClient } from "@supabase/supabase-js";
import { endTiketWithEvidence } from "../endTiketWithEvidence";

function fakeClient(opts: {
  tiketStatus: string;
  jenis: string;
  createdBy?: string;
  evidenceLokasiLatitude?: number | null;
  fotoTypes?: string[];
  pemilikIds?: string[];
  updateTiket?: jest.Mock;
  insertStatusLog?: jest.Mock;
  insertNotifikasi?: jest.Mock;
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
                    jenis: opts.jenis,
                    created_by: opts.createdBy ?? "admin-1",
                    evidence_lokasi_latitude: opts.evidenceLokasiLatitude ?? null,
                  },
                  error: null,
                }),
            }),
          }),
          update: (payload: unknown) => ({
            eq: (...args: unknown[]) => (opts.updateTiket ?? jest.fn())(payload, ...args),
          }),
        };
      }
      if (table === "tiket_foto") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: (opts.fotoTypes ?? []).map((type) => ({ type })),
                error: null,
              }),
          }),
        };
      }
      if (table === "tiket_status_log") {
        return { insert: opts.insertStatusLog ?? jest.fn().mockResolvedValue({ error: null }) };
      }
      if (table === "users") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: (opts.pemilikIds ?? ["pemilik-1"]).map((id) => ({ id })),
                error: null,
              }),
          }),
        };
      }
      if (table === "notifikasi") {
        const insertNotifikasi = opts.insertNotifikasi ?? jest.fn();
        return {
          insert: (...args: unknown[]) => {
            insertNotifikasi(...args);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
  } as unknown as SupabaseClient;
}

test("succeeds once all 4 evidence items are complete, moving the Tiket to Selesai and notifying Admin+Pemilik", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const insertNotifikasi = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    jenis: "instalasi",
    createdBy: "admin-1",
    evidenceLokasiLatitude: -6.2,
    fotoTypes: ["redaman", "ont", "kabel_jalur"],
    pemilikIds: ["pemilik-1"],
    updateTiket,
    insertNotifikasi,
  });

  const result = await endTiketWithEvidence(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });

  expect(updateTiket).toHaveBeenCalledWith(
    expect.objectContaining({ status: "selesai" }),
    "id",
    "tiket-1"
  );
  expect(insertNotifikasi).toHaveBeenCalledWith(
    expect.arrayContaining([
      { id: expect.any(String), user_id: "admin-1", tiket_id: "tiket-1", type: "selesai" },
      { id: expect.any(String), user_id: "pemilik-1", tiket_id: "tiket-1", type: "selesai" },
    ])
  );
  expect(result).toEqual({ success: true });
});

test("works the same way for Laporan Pelanggan (gangguan_komplain), not just Instalasi", async () => {
  const updateTiket = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    jenis: "gangguan_komplain",
    evidenceLokasiLatitude: -6.2,
    fotoTypes: ["redaman", "ont", "kabel_jalur"],
    updateTiket,
  });

  const result = await endTiketWithEvidence(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });

  expect(result).toEqual({ success: true });
});

test("rejects a Maintenance Tiket -- it doesn't use this evidence checklist", async () => {
  const updateTiket = jest.fn();
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    jenis: "maintenance",
    fotoTypes: ["redaman", "ont", "kabel_jalur"],
    evidenceLokasiLatitude: -6.2,
    updateTiket,
  });

  const result = await endTiketWithEvidence(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Jenis Tiket ini tidak memakai checklist bukti Instalasi.",
  });
});

test("rejects when the evidence checklist is still incomplete, without touching the Tiket status", async () => {
  const updateTiket = jest.fn();
  const client = fakeClient({
    tiketStatus: "dikerjakan",
    jenis: "instalasi",
    fotoTypes: ["redaman"], // ont, kabel_jalur, lokasi belum ada
    evidenceLokasiLatitude: null,
    updateTiket,
  });

  const result = await endTiketWithEvidence(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error:
      "Checklist bukti belum lengkap (Foto Redaman, Foto ONT, Foto Kabel & Jalur, Lokasi rumah pelanggan).",
  });
});

test("rejects when the Tiket isn't Dikerjakan, even if evidence is complete", async () => {
  const updateTiket = jest.fn();
  const client = fakeClient({
    tiketStatus: "pending",
    jenis: "instalasi",
    fotoTypes: ["redaman", "ont", "kabel_jalur"],
    evidenceLokasiLatitude: -6.2,
    updateTiket,
  });

  const result = await endTiketWithEvidence(client, {
    tiketId: "tiket-1",
    changedBy: "teknisi-1",
  });

  expect(updateTiket).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Tiket harus berstatus Dikerjakan untuk bisa di-End.",
  });
});
