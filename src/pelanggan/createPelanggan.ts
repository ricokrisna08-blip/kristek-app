import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProrata } from "./computeProrata";

export type NewPelangganInput = {
  nama: string;
  alamat: string;
  noHp: string;
  wilayahId: string;
  odpId: string;
  paketId: string;
  tanggalInstalasi: string;
};

export type PelangganRecord = {
  id: string;
  nama: string;
  alamat: string;
  noHp: string;
  nomorPelanggan: string;
  wilayahId: string;
  odpId: string;
  paketId: string;
  harga: number | null;
  tanggalInstalasi: string | null;
  tagihanProrata: number | null;
};

export type CreatePelangganResult =
  | { success: true; pelanggan: PelangganRecord }
  | { success: false; error: string };

export async function createPelanggan(
  client: SupabaseClient,
  input: NewPelangganInput
): Promise<CreatePelangganResult> {
  // Harga default Pelanggan baru ikut Paket yang dipilih -- tetap bisa
  // di-override manual belakangan lewat "Edit Harga Langganan" di layar
  // detail Pelanggan (misal ada subsidi/nego walau Paket-nya sama, lihat
  // migration 20260101200000_pelanggan_harga.sql).
  const { data: paket } = await client
    .from("paket")
    .select("harga")
    .eq("id", input.paketId)
    .single();

  const harga = paket?.harga ?? null;
  // Tagihan bulan pertama (prorata) -- cuma referensi info, TIDAK
  // ditagihkan otomatis lewat field harga (lihat computeProrata.ts).
  const tagihanProrata = harga != null ? computeProrata(input.tanggalInstalasi, harga) : null;

  const { data, error } = await client
    .from("pelanggan")
    .insert({
      nama: input.nama,
      alamat: input.alamat,
      no_hp: input.noHp,
      wilayah_id: input.wilayahId,
      odp_id: input.odpId,
      paket_id: input.paketId,
      harga,
      tanggal_instalasi: input.tanggalInstalasi,
      tagihan_prorata: tagihanProrata,
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Gagal menambah Pelanggan. Coba lagi." };
  }

  return {
    success: true,
    pelanggan: {
      id: data.id,
      nama: data.nama,
      alamat: data.alamat,
      noHp: data.no_hp,
      nomorPelanggan: data.nomor_pelanggan,
      wilayahId: data.wilayah_id,
      odpId: data.odp_id,
      paketId: data.paket_id,
      harga: data.harga ?? null,
      tanggalInstalasi: data.tanggal_instalasi ?? null,
      tagihanProrata: data.tagihan_prorata ?? null,
    },
  };
}
