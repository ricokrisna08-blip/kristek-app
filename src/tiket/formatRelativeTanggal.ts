function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatJam(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "hari ini, 09.40" / "kemarin, 15.10" / "3 hari lalu" / tanggal penuh
// kalau lebih dari seminggu -- dipakai buat baris meta di kartu Tiket
// (mis. Installation Evidence) supaya nggak berat "created_at: ...".
export function formatRelativeTanggal(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(target).getTime()) / (24 * 60 * 60 * 1000)
  );

  if (dayDiff === 0) return `Hari ini, ${formatJam(iso)}`;
  if (dayDiff === 1) return `Kemarin, ${formatJam(iso)}`;
  if (dayDiff > 1 && dayDiff <= 6) return `${dayDiff} hari lalu`;

  return target.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
