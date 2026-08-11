import type { SupabaseClient } from "@supabase/supabase-js";

export type NewPelangganInput = {
  nama: string;
  alamat: string;
  noHp: string;
  wilayahId: string;
  odpId: string;
  paketId: string;
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
};

export type CreatePelangganResult =
  | { success: true; pelanggan: PelangganRecord }
  | { success: false; error: string };

export async function createPelanggan(
  client: SupabaseClient,
  input: NewPelangganInput
): Promise<CreatePelangganResult> {
  const { data, error } = await client
    .from("pelanggan")
    .insert({
      nama: input.nama,
      alamat: input.alamat,
      no_hp: input.noHp,
      wilayah_id: input.wilayahId,
      odp_id: input.odpId,
      paket_id: input.paketId,
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
    },
  };
}
