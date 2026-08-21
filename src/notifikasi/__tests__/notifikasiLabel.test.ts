import { notifikasiLabel } from "../notifikasiLabel";
import type { Notifikasi } from "../listNotifikasi";

function baseNotif(overrides: Partial<Notifikasi>): Notifikasi {
  return {
    id: "n1",
    tiketId: "t1",
    type: "ditugaskan",
    readAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    tiketJenis: null,
    pelangganNama: null,
    odpLabel: null,
    notes: null,
    cutiTeknisiNama: null,
    cutiTanggalMulai: null,
    cutiTanggalSelesai: null,
    ...overrides,
  };
}

test("Instalasi assignment includes the Jenis and Pelanggan name", () => {
  const label = notifikasiLabel(
    baseNotif({ type: "ditugaskan", tiketJenis: "instalasi", pelangganNama: "Budi" })
  );

  expect(label).toBe("Instalasi — Budi baru ditugaskan ke Anda");
});

test("Maintenance notification falls back to the ODP label when there's no Pelanggan", () => {
  const label = notifikasiLabel(
    baseNotif({
      type: "pending",
      tiketJenis: "maintenance",
      odpLabel: "ODP-KRTK-001",
    })
  );

  expect(label).toBe("Maintenance — ODP-KRTK-001 masuk status Pending");
});

test("Laporan Pelanggan Selesai reads naturally", () => {
  const label = notifikasiLabel(
    baseNotif({
      type: "selesai",
      tiketJenis: "gangguan_komplain",
      pelangganNama: "Siti",
    })
  );

  expect(label).toBe("Laporan Pelanggan — Siti sudah Selesai");
});

test("Pending notification includes the technician's notes when present", () => {
  const label = notifikasiLabel(
    baseNotif({
      type: "pending",
      tiketJenis: "instalasi",
      pelangganNama: "Budi",
      notes: "Menunggu material dari gudang",
    })
  );

  expect(label).toBe(
    "Instalasi — Budi masuk status Pending — Catatan: Menunggu material dari gudang"
  );
});

test("Cuti submission includes the teknisi name, date range, and alasan", () => {
  const label = notifikasiLabel(
    baseNotif({
      type: "cuti_diajukan",
      tiketId: null,
      cutiTeknisiNama: "Ahmad Wahyudi",
      cutiTanggalMulai: "2026-08-20",
      cutiTanggalSelesai: "2026-08-22",
      notes: "Sakit demam",
    })
  );

  expect(label).toBe(
    "Ahmad Wahyudi mengajukan cuti/izin (20 Agu - 22 Agu) — Alasan: Sakit demam"
  );
});

test("Cuti submission falls back gracefully when the teknisi name is missing", () => {
  const label = notifikasiLabel(
    baseNotif({
      type: "cuti_diajukan",
      tiketId: null,
      cutiTanggalMulai: "2026-08-20",
      cutiTanggalSelesai: "2026-08-22",
    })
  );

  expect(label).toBe("Teknisi mengajukan cuti/izin (20 Agu - 22 Agu)");
});
