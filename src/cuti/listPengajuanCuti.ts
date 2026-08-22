import type { SupabaseClient } from "@supabase/supabase-js";

export type PengajuanCutiItem = {
  id: string;
  teknisiNama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  createdAt: string;
};

// RLS pada pengajuan_cuti otomatis membatasi hasilnya: Teknisi cuma lihat
// pengajuan miliknya sendiri, Admin & Pemilik lihat semua -- jadi satu
// fungsi ini dipakai di kedua layar (Ajukan Cuti milik Teknisi, dan
// Daftar Pengajuan Cuti milik Admin/Pemilik) tanpa parameter tambahan.
export async function listPengajuanCuti(
  client: SupabaseClient
): Promise<PengajuanCutiItem[]> {
  const { data, error } = await client
    .from("pengajuan_cuti")
    .select("id, tanggal_mulai, tanggal_selesai, alasan, created_at, teknisi_nama_snapshot")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    teknisiNama: row.teknisi_nama_snapshot ?? "Teknisi tidak diketahui",
    tanggalMulai: row.tanggal_mulai,
    tanggalSelesai: row.tanggal_selesai,
    alasan: row.alasan,
    createdAt: row.created_at,
  }));
}
