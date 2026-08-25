// Sama seperti computeProrata.ts: siklus tagihan KRISTEK jatuh tempo
// tanggal 3 tiap bulan (bukan kalender 1-31). Kompensasi gangguan
// dihitung sebagai (Lama Gangguan / total hari siklus BERJALAN saat ini)
// x Harga Langganan -- dibatasi maksimal sebesar Harga Langganan itu
// sendiri (nggak mungkin kompensasi lebih besar dari tagihannya).
const CUTOFF_DAY = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeKompensasi(
  hariGangguan: number,
  hargaSaatIni: number,
  today: Date = new Date()
): number {
  if (hariGangguan <= 0 || hargaSaatIni <= 0) return 0;

  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cycleStart =
    ref.getDate() >= CUTOFF_DAY
      ? new Date(ref.getFullYear(), ref.getMonth(), CUTOFF_DAY)
      : new Date(ref.getFullYear(), ref.getMonth() - 1, CUTOFF_DAY);
  const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, CUTOFF_DAY);

  const totalHariSiklus = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / MS_PER_DAY);
  if (totalHariSiklus <= 0) return 0;

  const kompensasi = Math.round((hargaSaatIni * hariGangguan) / totalHariSiklus);
  return Math.min(kompensasi, hargaSaatIni);
}
