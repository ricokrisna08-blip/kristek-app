import type { SupabaseClient } from "@supabase/supabase-js";
import { createPelanggan } from "../pelanggan/createPelanggan";
import { logTiketStatus } from "./logTiketStatus";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";

export type TiketJenis = "instalasi" | "gangguan_komplain" | "maintenance";

type CommonFields = {
  wilayahId: string;
  createdBy: string;
  teknisiIds: string[];
};

export type NewTiketInput =
  | (CommonFields & {
      jenis: "instalasi";
      pelangganBaru: {
        nama: string;
        alamat: string;
        noHp: string;
        odpId: string;
        paketId: string;
      };
    })
  | (CommonFields & {
      jenis: "gangguan_komplain";
      pelangganId: string;
      keluhan: string;
    })
  | (CommonFields & {
      jenis: "maintenance";
      odpId: string;
      deskripsiPekerjaan: string;
    });

export type CreateTiketResult =
  | { success: true; tiketId: string }
  | { success: false; error: string };

export async function createTiketWithAssignment(
  client: SupabaseClient,
  input: NewTiketInput
): Promise<CreateTiketResult> {
  const tiketPayload: Record<string, unknown> = {
    jenis: input.jenis,
    wilayah_id: input.wilayahId,
    created_by: input.createdBy,
    status: "ditugaskan",
  };

  if (input.jenis === "instalasi") {
    const pelangganResult = await createPelanggan(client, {
      nama: input.pelangganBaru.nama,
      alamat: input.pelangganBaru.alamat,
      noHp: input.pelangganBaru.noHp,
      wilayahId: input.wilayahId,
      odpId: input.pelangganBaru.odpId,
      paketId: input.pelangganBaru.paketId,
    });

    if (!pelangganResult.success) {
      return { success: false, error: pelangganResult.error };
    }

    tiketPayload.pelanggan_id = pelangganResult.pelanggan.id;
  } else if (input.jenis === "gangguan_komplain") {
    tiketPayload.pelanggan_id = input.pelangganId;
    tiketPayload.keluhan = input.keluhan;
  } else {
    tiketPayload.odp_id = input.odpId;
    tiketPayload.deskripsi_pekerjaan = input.deskripsiPekerjaan;
  }

  const { data: tiket, error: tiketError } = await client
    .from("tiket")
    .insert(tiketPayload)
    .select()
    .single();

  if (tiketError || !tiket) {
    return { success: false, error: "Gagal membuat Tiket. Coba lagi." };
  }

  const tiketId = tiket.id;

  await logTiketStatus(client, {
    tiketId,
    status: "ditugaskan",
    changedBy: input.createdBy,
  });

  const { error: assignError } = await client.from("tiket_teknisi").insert(
    input.teknisiIds.map((teknisiId) => ({
      tiket_id: tiketId,
      teknisi_id: teknisiId,
    }))
  );

  if (assignError) {
    return {
      success: false,
      error:
        "Tiket dibuat tapi gagal menugaskan Teknisi. Hubungi Pemilik untuk cek data.",
    };
  }

  const { data: insertedNotifikasi, error: notifikasiError } = await client
    .from("notifikasi")
    .insert(
      input.teknisiIds.map((teknisiId) => ({
        user_id: teknisiId,
        tiket_id: tiketId,
        type: "ditugaskan",
      }))
    )
    .select("id");

  for (const row of insertedNotifikasi ?? []) {
    triggerPushNotification(client, row.id);
  }

  if (notifikasiError) {
    return {
      success: false,
      error:
        "Tiket dibuat dan Teknisi ditugaskan, tapi notifikasi gagal terkirim.",
    };
  }

  return { success: true, tiketId };
}
