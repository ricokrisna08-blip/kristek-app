import type { Notifikasi } from "./listNotifikasi";
import { JENIS_LABEL } from "../tiket/labels";

const ACTION_BY_TYPE: Record<Notifikasi["type"], string> = {
  ditugaskan: "baru ditugaskan ke Anda",
  pending: "masuk status Pending",
  selesai: "sudah Selesai",
};

export function notifikasiLabel(notifikasi: Notifikasi): string {
  const jenisLabel = notifikasi.tiketJenis
    ? JENIS_LABEL[notifikasi.tiketJenis] ?? notifikasi.tiketJenis
    : "Tiket";
  const target = notifikasi.pelangganNama ?? notifikasi.odpLabel;
  const subject = target ? `${jenisLabel} — ${target}` : jenisLabel;
  const notesSuffix = notifikasi.notes ? ` — Catatan: ${notifikasi.notes}` : "";

  return `${subject} ${ACTION_BY_TYPE[notifikasi.type]}${notesSuffix}`;
}
