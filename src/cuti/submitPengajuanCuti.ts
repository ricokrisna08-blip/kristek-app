import type { SupabaseClient } from "@supabase/supabase-js";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";

export type NewPengajuanCutiInput = {
  teknisiId: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
};

export type SubmitPengajuanCutiResult =
  | { success: true }
  | { success: false; error: string };

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export async function submitPengajuanCuti(
  client: SupabaseClient,
  input: NewPengajuanCutiInput
): Promise<SubmitPengajuanCutiResult> {
  if (!DATE_FORMAT.test(input.tanggalMulai) || !DATE_FORMAT.test(input.tanggalSelesai)) {
    return { success: false, error: "Format tanggal harus YYYY-MM-DD." };
  }
  if (input.tanggalSelesai < input.tanggalMulai) {
    return { success: false, error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
  }
  if (!input.alasan.trim()) {
    return { success: false, error: "Alasan tidak boleh kosong." };
  }

  const { data: cuti, error: insertError } = await client
    .from("pengajuan_cuti")
    .insert({
      teknisi_id: input.teknisiId,
      tanggal_mulai: input.tanggalMulai,
      tanggal_selesai: input.tanggalSelesai,
      alasan: input.alasan.trim(),
    })
    .select("id")
    .single();

  if (insertError || !cuti) {
    return { success: false, error: "Gagal mengirim pengajuan cuti. Coba lagi." };
  }

  const { data: penerima } = await client
    .from("users")
    .select("id")
    .in("role", ["admin", "pemilik"]);

  if (penerima && penerima.length > 0) {
    const { data: insertedNotifikasi } = await client
      .from("notifikasi")
      .insert(
        penerima.map((user: { id: string }) => ({
          user_id: user.id,
          cuti_id: cuti.id,
          type: "cuti_diajukan",
          notes: input.alasan.trim(),
        }))
      )
      .select("id");

    for (const row of insertedNotifikasi ?? []) {
      triggerPushNotification(client, row.id);
    }
  }

  return { success: true };
}
