import type { SupabaseClient } from "@supabase/supabase-js";
import { submitPengajuanCuti } from "../submitPengajuanCuti";

function fakeClient(options: {
  insertError?: unknown;
  penerima?: Array<{ id: string }>;
}) {
  const notifikasiInserts: unknown[] = [];

  const client = {
    from: (table: string) => {
      if (table === "pengajuan_cuti") {
        return {
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve(
                  options.insertError
                    ? { data: null, error: options.insertError }
                    : { data: { id: "cuti-1" }, error: null }
                ),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: options.penerima ?? [], error: null }),
          }),
        };
      }
      if (table === "notifikasi") {
        return {
          insert: (rows: unknown) => {
            notifikasiInserts.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;

  return { client, notifikasiInserts };
}

const VALID_INPUT = {
  teknisiId: "teknisi-1",
  tanggalMulai: "2026-08-20",
  tanggalSelesai: "2026-08-22",
  alasan: "Sakit demam",
};

test("valid input creates the pengajuan and notifies every admin/pemilik", async () => {
  const { client, notifikasiInserts } = fakeClient({
    penerima: [{ id: "admin-1" }, { id: "pemilik-1" }],
  });

  const result = await submitPengajuanCuti(client, VALID_INPUT);

  expect(result).toEqual({ success: true });
  expect(notifikasiInserts).toEqual([
    [
      { user_id: "admin-1", cuti_id: "cuti-1", type: "cuti_diajukan", notes: "Sakit demam" },
      { user_id: "pemilik-1", cuti_id: "cuti-1", type: "cuti_diajukan", notes: "Sakit demam" },
    ],
  ]);
});

test("rejects an end date before the start date without hitting the database", async () => {
  const { client } = fakeClient({});

  const result = await submitPengajuanCuti(client, {
    ...VALID_INPUT,
    tanggalMulai: "2026-08-22",
    tanggalSelesai: "2026-08-20",
  });

  expect(result).toEqual({
    success: false,
    error: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });
});

test("rejects an empty alasan", async () => {
  const { client } = fakeClient({});

  const result = await submitPengajuanCuti(client, { ...VALID_INPUT, alasan: "   " });

  expect(result).toEqual({ success: false, error: "Alasan tidak boleh kosong." });
});

test("rejects a malformed date instead of silently sending bad data", async () => {
  const { client } = fakeClient({});

  const result = await submitPengajuanCuti(client, { ...VALID_INPUT, tanggalMulai: "20-08-2026" });

  expect(result).toEqual({ success: false, error: "Format tanggal harus YYYY-MM-DD." });
});

test("an insert failure returns a clear error instead of crashing", async () => {
  const { client } = fakeClient({ insertError: { message: "db error" } });

  const result = await submitPengajuanCuti(client, VALID_INPUT);

  expect(result).toEqual({
    success: false,
    error: "Gagal mengirim pengajuan cuti. Coba lagi.",
  });
});
