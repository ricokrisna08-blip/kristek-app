import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProrata } from "./computeProrata";

export type UpdatePelangganInput = {
  nama: string;
  alamat: string;
  noHp: string;
  odpId: string;
  wilayahId: string;
  paketId: string;
  // Kolom `date` murni ("YYYY-MM-DD") atau null. Dibiarkan bisa diisi
  // belakangan lewat Edit -- mis. Pelanggan yang sempat ditambah sebelum
  // fitur Tanggal Instalasi ada, jadi tagihan bulan pertamanya masih
  // bisa dihitung prorata (lihat computeProrata.ts).
  tanggalInstalasi: string | null;
};

export type UpdatePelangganResult =
  | { success: true; tanggalInstalasi: string | null; tagihanProrata: number | null }
  | { success: false; error: string };

export async function updatePelanggan(
  client: SupabaseClient,
  id: string,
  input: UpdatePelangganInput
): Promise<UpdatePelangganResult> {
  let tagihanProrata: number | null = null;

  if (input.tanggalInstalasi) {
    const { data: paket } = await client
      .from("paket")
      .select("harga")
      .eq("id", input.paketId)
      .single();

    if (paket?.harga != null) {
      tagihanProrata = computeProrata(input.tanggalInstalasi, paket.harga);
    }
  }

  const { error } = await client
    .from("pelanggan")
    .update({
      nama: input.nama,
      alamat: input.alamat,
      no_hp: input.noHp,
      odp_id: input.odpId,
      wilayah_id: input.wilayahId,
      paket_id: input.paketId,
      tanggal_instalasi: input.tanggalInstalasi,
      tagihan_prorata: tagihanProrata,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal menyimpan perubahan Pelanggan. Coba lagi." };
  }

  return { success: true, tanggalInstalasi: input.tanggalInstalasi, tagihanProrata };
}
