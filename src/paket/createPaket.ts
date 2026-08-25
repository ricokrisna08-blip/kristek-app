import type { SupabaseClient } from "@supabase/supabase-js";
import type { Paket } from "./listPaket";

export type CreatePaketResult =
  | { success: true; paket: Paket }
  | { success: false; error: string };

export async function createPaket(
  client: SupabaseClient,
  nama: string,
  harga: number | null
): Promise<CreatePaketResult> {
  const trimmedNama = nama.trim();

  if (!trimmedNama) {
    return { success: false, error: "Nama Paket tidak boleh kosong" };
  }

  const { data, error } = await client
    .from("paket")
    .insert({ nama: trimmedNama, harga })
    .select()
    .single();

  if (error || !data) {
    const isDuplicateName = (error as { code?: string } | null)?.code === "23505";
    return {
      success: false,
      error: isDuplicateName
        ? "Paket dengan nama ini sudah ada"
        : "Gagal menambah Paket. Coba lagi.",
    };
  }

  return { success: true, paket: { id: data.id, nama: data.nama, harga: data.harga ?? null } };
}
