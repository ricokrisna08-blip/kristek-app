import type { SupabaseClient } from "@supabase/supabase-js";

export type NewPengeluaranInput = {
  kategori: string;
  keterangan: string;
  // Isi salah satu -- nominal (flat Rupiah) atau persen (% dari Sudah
  // Bayar bulan itu, dihitung otomatis, lihat listPengeluaranPeriode.ts).
  nominal: number | null;
  persen: number | null;
  tanggal: string;
  createdBy: string;
};

export type CreatePengeluaranResult = { success: true } | { success: false; error: string };

export async function createPengeluaran(
  client: SupabaseClient,
  input: NewPengeluaranInput
): Promise<CreatePengeluaranResult> {
  if (!input.kategori.trim() || !input.keterangan.trim()) {
    return { success: false, error: "Kategori dan Keterangan tidak boleh kosong." };
  }

  const hasNominal = input.nominal != null;
  const hasPersen = input.persen != null;
  if (hasNominal === hasPersen) {
    return { success: false, error: "Isi salah satu: Nominal (Rp) atau Persen (%)." };
  }
  if (hasNominal && (input.nominal as number) <= 0) {
    return { success: false, error: "Nominal harus lebih dari 0." };
  }
  if (hasPersen && ((input.persen as number) <= 0 || (input.persen as number) > 100)) {
    return { success: false, error: "Persen harus di antara 0 dan 100." };
  }

  const { error } = await client.from("pengeluaran").insert({
    kategori: input.kategori.trim(),
    keterangan: input.keterangan.trim(),
    nominal: input.nominal,
    persen: input.persen,
    tanggal: input.tanggal,
    created_by: input.createdBy,
  });

  if (error) {
    return { success: false, error: "Gagal menyimpan pengeluaran. Coba lagi." };
  }

  return { success: true };
}
