import type { SupabaseClient } from "@supabase/supabase-js";
import type { Wilayah } from "./listWilayah";

export type CreateWilayahResult =
  | { success: true; wilayah: Wilayah }
  | { success: false; error: string };

export async function createWilayah(
  client: SupabaseClient,
  nama: string
): Promise<CreateWilayahResult> {
  const trimmedNama = nama.trim();

  if (!trimmedNama) {
    return { success: false, error: "Nama Wilayah tidak boleh kosong" };
  }

  const { data, error } = await client
    .from("wilayah")
    .insert({ nama: trimmedNama })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Gagal menambah Wilayah. Coba lagi." };
  }

  return { success: true, wilayah: { id: data.id, nama: data.nama } };
}
