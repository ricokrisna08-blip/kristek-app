import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountListItem = {
  id: string;
  nama: string;
  username: string;
  role: "admin" | "teknisi" | "dc";
  wilayahNama: string | null;
};

export async function listAccounts(
  client: SupabaseClient
): Promise<AccountListItem[]> {
  const { data, error } = await client
    .from("users")
    .select("id, nama, username, role, wilayah:wilayah_id (nama)")
    .in("role", ["admin", "teknisi", "dc"])
    .order("nama");

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    nama: row.nama,
    username: row.username,
    role: row.role,
    wilayahNama: row.wilayah?.nama ?? null,
  }));
}
