import type { SupabaseClient } from "@supabase/supabase-js";
import { createPengeluaran } from "../createPengeluaran";

function fakeClient(insertError: unknown = null) {
  const insertCalls: unknown[] = [];

  const client = {
    from: () => ({
      insert: (row: unknown) => {
        insertCalls.push(row);
        return Promise.resolve({ error: insertError });
      },
    }),
  } as unknown as SupabaseClient;

  return { client, insertCalls };
}

const VALID_NOMINAL = {
  kategori: "Gaji",
  keterangan: "Gaji Awe",
  nominal: 1500000,
  persen: null,
  tanggal: "2026-08-27",
  createdBy: "user-1",
};

test("valid nominal-based input inserts the row", async () => {
  const { client, insertCalls } = fakeClient();

  const result = await createPengeluaran(client, VALID_NOMINAL);

  expect(result).toEqual({ success: true });
  expect(insertCalls).toEqual([
    {
      kategori: "Gaji",
      keterangan: "Gaji Awe",
      nominal: 1500000,
      persen: null,
      tanggal: "2026-08-27",
      created_by: "user-1",
    },
  ]);
});

test("valid persen-based input inserts the row", async () => {
  const { client, insertCalls } = fakeClient();

  const result = await createPengeluaran(client, {
    kategori: "Fee ISP",
    keterangan: "Fee ISP 3%",
    nominal: null,
    persen: 3,
    tanggal: "2026-08-27",
    createdBy: "user-1",
  });

  expect(result).toEqual({ success: true });
  expect(insertCalls).toEqual([
    {
      kategori: "Fee ISP",
      keterangan: "Fee ISP 3%",
      nominal: null,
      persen: 3,
      tanggal: "2026-08-27",
      created_by: "user-1",
    },
  ]);
});

test("rejects empty kategori/keterangan", async () => {
  const { client } = fakeClient();

  const result = await createPengeluaran(client, { ...VALID_NOMINAL, kategori: "   " });

  expect(result).toEqual({
    success: false,
    error: "Kategori dan Keterangan tidak boleh kosong.",
  });
});

test("rejects when both nominal and persen are set", async () => {
  const { client } = fakeClient();

  const result = await createPengeluaran(client, { ...VALID_NOMINAL, persen: 3 });

  expect(result).toEqual({
    success: false,
    error: "Isi salah satu: Nominal (Rp) atau Persen (%).",
  });
});

test("rejects when neither nominal nor persen are set", async () => {
  const { client } = fakeClient();

  const result = await createPengeluaran(client, { ...VALID_NOMINAL, nominal: null });

  expect(result).toEqual({
    success: false,
    error: "Isi salah satu: Nominal (Rp) atau Persen (%).",
  });
});

test("rejects a non-positive nominal", async () => {
  const { client } = fakeClient();

  const result = await createPengeluaran(client, { ...VALID_NOMINAL, nominal: 0 });

  expect(result).toEqual({ success: false, error: "Nominal harus lebih dari 0." });
});

test("rejects a persen outside 0-100", async () => {
  const { client } = fakeClient();

  const result = await createPengeluaran(client, {
    ...VALID_NOMINAL,
    nominal: null,
    persen: 150,
  });

  expect(result).toEqual({ success: false, error: "Persen harus di antara 0 dan 100." });
});

test("an insert failure returns a clear error instead of crashing", async () => {
  const { client } = fakeClient({ message: "db error" });

  const result = await createPengeluaran(client, VALID_NOMINAL);

  expect(result).toEqual({ success: false, error: "Gagal menyimpan pengeluaran. Coba lagi." });
});
