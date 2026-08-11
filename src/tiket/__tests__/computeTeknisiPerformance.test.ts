import { computeTeknisiPerformance } from "../computeTeknisiPerformance";

test("counts Tiket Selesai, averages Durasi Kerja, and counts Pending events for a Teknisi", () => {
  const result = computeTeknisiPerformance({
    teknisiList: [{ id: "teknisi-1", nama: "Budi" }],
    assignments: [
      { tiketId: "tiket-1", teknisiId: "teknisi-1" },
      { tiketId: "tiket-2", teknisiId: "teknisi-1" },
    ],
    tikets: [
      {
        id: "tiket-1",
        status: "selesai",
        startedAt: "2026-08-01T10:00:00.000Z",
        endedAt: "2026-08-01T12:00:00.000Z",
        accumulatedPendingSeconds: 0,
      },
      {
        id: "tiket-2",
        status: "selesai",
        startedAt: "2026-08-02T10:00:00.000Z",
        endedAt: "2026-08-02T11:00:00.000Z",
        accumulatedPendingSeconds: 0,
      },
    ],
    pendingEvents: [{ tiketId: "tiket-1" }, { tiketId: "tiket-1" }],
  });

  expect(result).toEqual([
    {
      teknisiId: "teknisi-1",
      namaTeknisi: "Budi",
      jumlahTiketSelesai: 2,
      rataRataDurasiKerjaSeconds: 1.5 * 60 * 60,
      jumlahKaliPending: 2,
    },
  ]);
});

test("credits every Teknisi on a shared Tiket equally (ADR-0002)", () => {
  const result = computeTeknisiPerformance({
    teknisiList: [
      { id: "teknisi-1", nama: "Budi" },
      { id: "teknisi-2", nama: "Siti" },
    ],
    assignments: [
      { tiketId: "tiket-1", teknisiId: "teknisi-1" },
      { tiketId: "tiket-1", teknisiId: "teknisi-2" },
    ],
    tikets: [
      {
        id: "tiket-1",
        status: "selesai",
        startedAt: "2026-08-01T10:00:00.000Z",
        endedAt: "2026-08-01T11:00:00.000Z",
        accumulatedPendingSeconds: 0,
      },
    ],
    pendingEvents: [],
  });

  expect(result[0].jumlahTiketSelesai).toBe(1);
  expect(result[1].jumlahTiketSelesai).toBe(1);
});

test("a Teknisi with no Tiket Selesai has a null average and zero count", () => {
  const result = computeTeknisiPerformance({
    teknisiList: [{ id: "teknisi-1", nama: "Budi" }],
    assignments: [{ tiketId: "tiket-1", teknisiId: "teknisi-1" }],
    tikets: [
      {
        id: "tiket-1",
        status: "dikerjakan",
        startedAt: "2026-08-01T10:00:00.000Z",
        endedAt: null,
        accumulatedPendingSeconds: 0,
      },
    ],
    pendingEvents: [{ tiketId: "tiket-1" }],
  });

  expect(result).toEqual([
    {
      teknisiId: "teknisi-1",
      namaTeknisi: "Budi",
      jumlahTiketSelesai: 0,
      rataRataDurasiKerjaSeconds: null,
      jumlahKaliPending: 1,
    },
  ]);
});

test("Pending events on Tiket not assigned to a Teknisi don't count toward them", () => {
  const result = computeTeknisiPerformance({
    teknisiList: [{ id: "teknisi-1", nama: "Budi" }],
    assignments: [{ tiketId: "tiket-1", teknisiId: "teknisi-1" }],
    tikets: [
      {
        id: "tiket-1",
        status: "dikerjakan",
        startedAt: "2026-08-01T10:00:00.000Z",
        endedAt: null,
        accumulatedPendingSeconds: 0,
      },
    ],
    pendingEvents: [{ tiketId: "tiket-lain" }],
  });

  expect(result[0].jumlahKaliPending).toBe(0);
});
