import {
  requiresEvidenceChecklist,
  computeEvidenceStatus,
  isEvidenceComplete,
  countEvidenceComplete,
  isEvidenceFotoDone,
} from "../instalasiEvidence";

test("checklist evidence berlaku untuk Instalasi dan Laporan Pelanggan, tidak untuk Maintenance", () => {
  expect(requiresEvidenceChecklist("instalasi")).toBe(true);
  expect(requiresEvidenceChecklist("gangguan_komplain")).toBe(true);
  expect(requiresEvidenceChecklist("maintenance")).toBe(false);
});

test("computeEvidenceStatus membaca 3 tipe foto dan status lokasi", () => {
  const status = computeEvidenceStatus({
    fotoTypes: ["redaman", "kabel_jalur"],
    hasLokasi: true,
  });

  expect(status).toEqual({ redaman: true, ont: false, kabelJalur: true, lokasi: true });
});

test("isEvidenceComplete cuma true kalau ke-4 nya terisi", () => {
  expect(
    isEvidenceComplete({ redaman: true, ont: true, kabelJalur: true, lokasi: true })
  ).toBe(true);
  expect(
    isEvidenceComplete({ redaman: true, ont: true, kabelJalur: true, lokasi: false })
  ).toBe(false);
});

test("countEvidenceComplete menghitung berapa item yang sudah lengkap", () => {
  expect(
    countEvidenceComplete({ redaman: true, ont: false, kabelJalur: true, lokasi: false })
  ).toBe(2);
});

test("isEvidenceFotoDone memetakan tipe foto ke field status yang benar", () => {
  const status = { redaman: true, ont: false, kabelJalur: true, lokasi: false };
  expect(isEvidenceFotoDone(status, "redaman")).toBe(true);
  expect(isEvidenceFotoDone(status, "ont")).toBe(false);
  expect(isEvidenceFotoDone(status, "kabel_jalur")).toBe(true);
});
