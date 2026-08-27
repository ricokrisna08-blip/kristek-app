import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganDetail = {
  id: string;
  nama: string;
  alamat: string;
  noHp: string;
  nomorPelanggan: string;
  wilayahId: string;
  wilayahNama: string | null;
  odpId: string;
  odpLabel: string | null;
  paketId: string | null;
  paketNama: string | null;
  harga: number | null;
  mikrotikUsername: string | null;
  sudahBayarBulanIni: boolean;
  isIsolir: boolean;
  isActive: boolean;
  isBenefit: boolean;
  subsidiAktif: number | null;
  prorate: boolean;
  tanggalInstalasi: string | null;
  tagihanProrata: number | null;
  kompensasiHari: number | null;
  kompensasiNominal: number | null;
  catatan: string | null;
};

export async function getPelangganDetail(
  client: SupabaseClient,
  id: string
): Promise<PelangganDetail | null> {
  const { data, error } = await client
    .from("pelanggan")
    .select(
      "id, nama, alamat, no_hp, nomor_pelanggan, wilayah_id, wilayah:wilayah_id (nama), odp_id, odp:odp_id (label), paket_id, paket:paket_id (nama), harga, mikrotik_username, sudah_bayar_bulan_ini, is_isolir, is_active, is_benefit, subsidi_aktif, prorate, tanggal_instalasi, tagihan_prorata, kompensasi_hari, kompensasi_nominal, catatan"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as any;

  return {
    id: row.id,
    nama: row.nama,
    alamat: row.alamat,
    noHp: row.no_hp,
    nomorPelanggan: row.nomor_pelanggan,
    wilayahId: row.wilayah_id,
    wilayahNama: row.wilayah?.nama ?? null,
    odpId: row.odp_id,
    odpLabel: row.odp?.label ?? null,
    paketId: row.paket_id,
    paketNama: row.paket?.nama ?? null,
    harga: row.harga ?? null,
    mikrotikUsername: row.mikrotik_username ?? null,
    sudahBayarBulanIni: row.sudah_bayar_bulan_ini ?? false,
    isIsolir: row.is_isolir ?? false,
    isActive: row.is_active ?? true,
    isBenefit: row.is_benefit ?? false,
    subsidiAktif: row.subsidi_aktif ?? null,
    prorate: row.prorate ?? false,
    tanggalInstalasi: row.tanggal_instalasi ?? null,
    tagihanProrata: row.tagihan_prorata ?? null,
    kompensasiHari: row.kompensasi_hari ?? null,
    kompensasiNominal: row.kompensasi_nominal ?? null,
    catatan: row.catatan ?? null,
  };
}
