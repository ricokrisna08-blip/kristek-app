import type { SupabaseClient } from "@supabase/supabase-js";

export type DcUser = { id: string; nama: string };

// Tabel `users` sendiri nggak kebuka buat role DC (lihat trust model di
// 20260827020000_pelanggan_dc_flag.sql), jadi daftar akun DC lain buat
// dropdown "Dibayar ke" diambil lewat RPC scoped `list_dc_users`
// (cuma id+nama, bukan baris users penuh).
export async function listDcUsers(client: SupabaseClient): Promise<DcUser[]> {
  const { data, error } = await client.rpc("list_dc_users");

  if (error || !data) {
    return [];
  }

  return (data as { id: string; nama: string }[]).map((row) => ({
    id: row.id,
    nama: row.nama,
  }));
}
