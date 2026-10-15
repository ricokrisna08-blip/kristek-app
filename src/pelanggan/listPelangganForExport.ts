import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganExportRow = {
  nama: string;
  alamat: string;
  paketNama: string | null;
  harga: number | null;
  noHp: string;
  status: "Aktif" | "Isolir" | "Nonaktif";
};

// "Status Pelanggan": Isolir menang duluan -- isolir SEKARANG selalu ikut
// nge-set is_active=false juga (lihat setPelangganIsolir.ts/
// mikrotik-set-isolir), jadi kalau is_active dicek duluan, Pelanggan yang
// cuma lagi diisolir (masih pelanggan, internetnya diputus sementara
// karena nunggak) bakal kebaca "Nonaktif" -- padahal "Nonaktif" artinya
// beneran sudah berhenti berlangganan (lihat is_active di
// updatePelangganStatus.ts). Isolir harus tetap kebaca "Isolir" meskipun
// is_active-nya ikut false.
function computeStatus(isActive: boolean, isIsolir: boolean): PelangganExportRow["status"] {
  if (isIsolir) return "Isolir";
  if (!isActive) return "Nonaktif";
  return "Aktif";
}

export async function listPelangganForExport(
  client: SupabaseClient
): Promise<PelangganExportRow[]> {
  const { data, error } = await client
    .from("pelanggan")
    .select("nama, alamat, no_hp, harga, is_active, is_isolir, paket:paket_id ( nama )")
    .order("nama");

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    nama: row.nama,
    alamat: row.alamat,
    paketNama: row.paket?.nama ?? null,
    harga: row.harga ?? null,
    noHp: row.no_hp,
    status: computeStatus(row.is_active, row.is_isolir),
  }));
}
