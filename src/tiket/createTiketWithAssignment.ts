import type { SupabaseClient } from "@supabase/supabase-js";
import { createPelanggan } from "../pelanggan/createPelanggan";
import { createMikrotikSecret } from "../pelanggan/createMikrotikSecret";
import { logTiketStatus } from "./logTiketStatus";
import { triggerPushNotification } from "../notifikasi/triggerPushNotification";
import { generateUuid } from "../lib/generateUuid";

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
        mikrotikUsername: string;
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
  | { success: true; tiketId: string; mikrotikWarning?: string | null }
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

  let mikrotikWarning: string | null = null;

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

    // Username Mikrotik wajib diisi di form -- Pelanggan-nya sendiri sudah
    // berhasil dibuat di titik ini, jadi kalau langkah Mikrotik ini gagal
    // (mis. Mikrotik lagi mati), tetap lanjut buat Tiket seperti biasa,
    // cuma bawa pesan warning-nya sampai ke pemanggil.
    const mikrotikResult = await createMikrotikSecret(
      client,
      pelangganResult.pelanggan.id,
      input.pelangganBaru.mikrotikUsername.trim()
    );
    if (!mikrotikResult.success) {
      mikrotikWarning = `Pelanggan & Tiket berhasil dibuat, tapi gagal set Username Mikrotik: ${mikrotikResult.error} Coba set manual di layar detail Pelanggan.`;
    }
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

  // Snapshot nama teknisi di saat assignment -- supaya Laporan Performa
  // tetap bisa nampilin nama & histori kerja teknisi itu walau akunnya
  // suatu saat dihapus (lihat delete-account Edge Function).
  const { data: teknisiRows } = await client
    .from("users")
    .select("id, nama")
    .in("id", input.teknisiIds);
  const namaById = new Map((teknisiRows ?? []).map((row) => [row.id, row.nama]));

  const { error: assignError } = await client.from("tiket_teknisi").insert(
    input.teknisiIds.map((teknisiId) => ({
      tiket_id: tiketId,
      teknisi_id: teknisiId,
      teknisi_nama_snapshot: namaById.get(teknisiId) ?? null,
    }))
  );

  if (assignError) {
    return {
      success: false,
      error:
        "Tiket dibuat tapi gagal menugaskan Teknisi. Hubungi Pemilik untuk cek data.",
    };
  }

  const notifikasiRows = input.teknisiIds.map((teknisiId) => ({
    id: generateUuid(),
    user_id: teknisiId,
    tiket_id: tiketId,
    type: "ditugaskan",
  }));

  const { error: notifikasiError } = await client.from("notifikasi").insert(notifikasiRows);

  if (!notifikasiError) {
    for (const row of notifikasiRows) {
      triggerPushNotification(client, row.id);
    }
  }

  if (notifikasiError) {
    return {
      success: false,
      error:
        "Tiket dibuat dan Teknisi ditugaskan, tapi notifikasi gagal terkirim.",
    };
  }

  return { success: true, tiketId, mikrotikWarning };
}
