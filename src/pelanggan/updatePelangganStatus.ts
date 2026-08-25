import type { SupabaseClient } from "@supabase/supabase-js";
import { computeKompensasi } from "./computeKompensasi";

export type PelangganStatusInput = {
  isActive: boolean;
  isBenefit: boolean;
  subsidiAktif: number | null;
  prorate: boolean;
  // Lama gangguan (hari) yang dikompensasi Pemilik. Nominalnya dihitung
  // otomatis dari hargaSaatIni (lihat computeKompensasi.ts) -- TIDAK
  // menimpa kolom harga, cuma dikurangkan dari tagihan yang di-blast WA
  // bulan ini (lihat fetchBillingFromSupabase.ts di kristek-wa-blast),
  // lalu di-reset ke null di siklus berikutnya (mikrotik-daily-billing-cycle).
  kompensasiHari: number | null;
  // Harga Langganan Pelanggan SAAT INI -- dipakai sebagai basis hitung
  // kompensasi, bukan buat ditulis balik ke kolom harga.
  hargaSaatIni: number | null;
};

export type UpdatePelangganStatusResult =
  | { success: true; kompensasiNominal: number | null }
  | { success: false; error: string };

// Subsidi Aktif & Kompensasi di sini murni catatan kebijakan Pemilik --
// TIDAK menimpa Harga Langganan. Harga Paket cuma default awal saat
// Pelanggan dibuat (lihat createPelanggan.ts); begitu Pelanggan sudah
// ada, Harga Langganan harus tetap bisa diedit bebas lewat "Edit Harga
// Langganan" tanpa ketimpa ulang oleh Subsidi/Kompensasi/Paket.
export async function updatePelangganStatus(
  client: SupabaseClient,
  id: string,
  input: PelangganStatusInput
): Promise<UpdatePelangganStatusResult> {
  const kompensasiNominal =
    input.kompensasiHari && input.hargaSaatIni != null
      ? computeKompensasi(input.kompensasiHari, input.hargaSaatIni)
      : null;

  const { error } = await client
    .from("pelanggan")
    .update({
      is_active: input.isActive,
      is_benefit: input.isBenefit,
      subsidi_aktif: input.subsidiAktif,
      prorate: input.prorate,
      kompensasi_hari: input.kompensasiHari,
      kompensasi_nominal: kompensasiNominal,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan status Pelanggan. Coba lagi." };
  }

  return { success: true, kompensasiNominal };
}
