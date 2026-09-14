import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganExportRow = {
  nama: string;
  alamat: string;
  paketNama: string | null;
  harga: number | null;
  noHp: string;
  status: "Aktif" | "Isolir" | "Nonaktif";
};

// "Status Pelanggan": Nonaktif menang duluan (Pelanggan yang sudah
// berhenti berlangganan, lihat is_active di updatePelangganStatus.ts),
// baru Isolir (koneksi diputus karena belum bayar), sisanya Aktif.
function computeStatus(isActive: boolean, isIsolir: boolean): PelangganExportRow["status"] {
  if (!isActive) return "Nonaktif";
  if (isIsolir) return "Isolir";
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
