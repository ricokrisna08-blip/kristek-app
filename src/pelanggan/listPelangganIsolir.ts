import type { SupabaseClient } from "@supabase/supabase-js";

export type PelangganIsolir = {
  id: string;
  nama: string;
  alamat: string;
  noHp: string;
  wilayahNama: string | null;
  odpLabel: string | null;
  isolirAt: string | null;
};

// RLS pada `pelanggan` sudah scoping baca per role (Admin cuma Wilayah
// sendiri, Pemilik lintas Wilayah, dst) -- select polos di sini otomatis
// ikut itu, sama seperti listBelumBayarUntukDc.ts.
export async function listPelangganIsolir(client: SupabaseClient): Promise<PelangganIsolir[]> {
  const { data, error } = await client
    .from("pelanggan")
    .select(
      "id, nama, alamat, no_hp, isolir_at, wilayah:wilayah_id (nama), odp:odp_id (label)"
    )
    .eq("is_isolir", true)
    .order("isolir_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    nama: row.nama,
    alamat: row.alamat,
    noHp: row.no_hp,
    wilayahNama: row.wilayah?.nama ?? null,
    odpLabel: row.odp?.label ?? null,
    isolirAt: row.isolir_at ?? null,
  }));
}
