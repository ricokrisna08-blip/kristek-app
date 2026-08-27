import type { Notifikasi } from "./listNotifikasi";
import { JENIS_LABEL } from "../tiket/labels";

const ACTION_BY_TIKET_TYPE: Record<"ditugaskan" | "pending" | "selesai", string> = {
  ditugaskan: "baru ditugaskan ke Anda",
  pending: "masuk status Pending",
  selesai: "sudah Selesai",
};

function formatTanggalPendek(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function notifikasiLabel(notifikasi: Notifikasi): string {
  if (notifikasi.type === "setoran_dc") {
    const nama = notifikasi.setoranPelangganNama ?? "Pelanggan";
    const alamatSuffix = notifikasi.setoranPelangganAlamat
      ? ` (${notifikasi.setoranPelangganAlamat})`
      : "";
    return `Setoran dari DC untuk ${nama}${alamatSuffix} menunggu approval`;
  }

  if (notifikasi.type === "cuti_diajukan") {
    const nama = notifikasi.cutiTeknisiNama ?? "Teknisi";
    const rentang =
      notifikasi.cutiTanggalMulai && notifikasi.cutiTanggalSelesai
        ? `${formatTanggalPendek(notifikasi.cutiTanggalMulai)} - ${formatTanggalPendek(notifikasi.cutiTanggalSelesai)}`
        : null;
    const rentangSuffix = rentang ? ` (${rentang})` : "";
    const alasanSuffix = notifikasi.notes ? ` — Alasan: ${notifikasi.notes}` : "";

    return `${nama} mengajukan cuti/izin${rentangSuffix}${alasanSuffix}`;
  }

  const jenisLabel = notifikasi.tiketJenis
    ? JENIS_LABEL[notifikasi.tiketJenis] ?? notifikasi.tiketJenis
    : "Tiket";
  const target = notifikasi.pelangganNama ?? notifikasi.odpLabel;
  const subject = target ? `${jenisLabel} — ${target}` : jenisLabel;
  const notesSuffix = notifikasi.notes ? ` — Catatan: ${notifikasi.notes}` : "";

  return `${subject} ${ACTION_BY_TIKET_TYPE[notifikasi.type]}${notesSuffix}`;
}
