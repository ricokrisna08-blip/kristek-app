export function computeDurasiKerjaSeconds(
  startedAt: string,
  endedAt: string,
  accumulatedPendingSeconds: number
): number {
  const totalSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  return Math.max(0, totalSeconds - accumulatedPendingSeconds);
}

export function formatDurasiKerja(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} menit`;
  }
  return `${hours} jam ${minutes} menit`;
}
