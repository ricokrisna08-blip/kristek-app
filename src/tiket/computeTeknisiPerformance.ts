import { computeDurasiKerjaSeconds } from "./durasiKerja";

export type TeknisiPerformance = {
  teknisiId: string;
  namaTeknisi: string;
  jumlahTiketSelesai: number;
  rataRataDurasiKerjaSeconds: number | null;
  jumlahKaliPending: number;
};

export type ComputeTeknisiPerformanceInput = {
  teknisiList: { id: string; nama: string }[];
  assignments: { tiketId: string; teknisiId: string }[];
  tikets: {
    id: string;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    accumulatedPendingSeconds: number;
  }[];
  pendingEvents: { tiketId: string }[];
};

export function computeTeknisiPerformance(
  input: ComputeTeknisiPerformanceInput
): TeknisiPerformance[] {
  return input.teknisiList.map((teknisi) => {
    const assignedTiketIds = input.assignments
      .filter((a) => a.teknisiId === teknisi.id)
      .map((a) => a.tiketId);

    const selesaiTikets = input.tikets.filter(
      (t) =>
        assignedTiketIds.includes(t.id) &&
        t.status === "selesai" &&
        t.startedAt &&
        t.endedAt
    );

    const durations = selesaiTikets.map((t) =>
      computeDurasiKerjaSeconds(t.startedAt!, t.endedAt!, t.accumulatedPendingSeconds)
    );

    const rataRataDurasiKerjaSeconds =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : null;

    const jumlahKaliPending = input.pendingEvents.filter((p) =>
      assignedTiketIds.includes(p.tiketId)
    ).length;

    return {
      teknisiId: teknisi.id,
      namaTeknisi: teknisi.nama,
      jumlahTiketSelesai: selesaiTikets.length,
      rataRataDurasiKerjaSeconds,
      jumlahKaliPending,
    };
  });
}
