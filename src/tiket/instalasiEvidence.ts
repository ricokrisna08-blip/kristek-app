// Checklist bukti (Foto Redaman, Foto ONT, Foto Kabel & Jalur, Lokasi
// rumah pelanggan) yang menggantikan foto "after" generik untuk Tiket
// Instalasi & Laporan Pelanggan -- Maintenance tetap pakai before/after
// generik seperti sebelumnya.

export function requiresEvidenceChecklist(jenis: string): boolean {
  return jenis === "instalasi" || jenis === "gangguan_komplain";
}

export const EVIDENCE_FOTO_TYPES = ["redaman", "ont", "kabel_jalur"] as const;
export type EvidenceFotoType = (typeof EVIDENCE_FOTO_TYPES)[number];

export const EVIDENCE_ITEM_COUNT = EVIDENCE_FOTO_TYPES.length + 1; // + Lokasi

export type EvidenceStatus = {
  redaman: boolean;
  ont: boolean;
  kabelJalur: boolean;
  lokasi: boolean;
};

export function computeEvidenceStatus(input: {
  fotoTypes: string[];
  hasLokasi: boolean;
}): EvidenceStatus {
  return {
    redaman: input.fotoTypes.includes("redaman"),
    ont: input.fotoTypes.includes("ont"),
    kabelJalur: input.fotoTypes.includes("kabel_jalur"),
    lokasi: input.hasLokasi,
  };
}

export function isEvidenceComplete(status: EvidenceStatus): boolean {
  return status.redaman && status.ont && status.kabelJalur && status.lokasi;
}

export function countEvidenceComplete(status: EvidenceStatus): number {
  return [status.redaman, status.ont, status.kabelJalur, status.lokasi].filter(Boolean).length;
}

export function isEvidenceFotoDone(status: EvidenceStatus, type: EvidenceFotoType): boolean {
  if (type === "redaman") return status.redaman;
  if (type === "ont") return status.ont;
  return status.kabelJalur;
}
