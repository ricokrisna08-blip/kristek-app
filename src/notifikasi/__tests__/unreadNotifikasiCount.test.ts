import { unreadNotifikasiCount } from "../unreadNotifikasiCount";
import type { Notifikasi } from "../listNotifikasi";

function notif(readAt: string | null): Notifikasi {
  return {
    id: "n1",
    tiketId: "t1",
    type: "ditugaskan",
    readAt,
    createdAt: "2026-01-01T00:00:00Z",
    tiketJenis: "instalasi",
    pelangganNama: "Budi",
    odpLabel: null,
    notes: null,
    cutiTeknisiNama: null,
    cutiTanggalMulai: null,
    cutiTanggalSelesai: null,
  };
}

test("counts only notifications with readAt === null", () => {
  const notifikasi = [notif(null), notif("2026-01-01T00:00:00Z"), notif(null)];

  expect(unreadNotifikasiCount(notifikasi)).toBe(2);
});
