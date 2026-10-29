// Siklus tagihan KRISTEK jatuh tempo tanggal 3 tiap bulan (lihat
// mikrotik-daily-billing-cycle) -- BUKAN kalender 1-31. Tagihan bulan
// pertama Pelanggan baru dihitung prorata dari tanggal Instalasi sampai
// tanggal 3 berikutnya, dibagi total hari 1 siklus penuh (tanggal 3 ke
// tanggal 3 bulan berikutnya).
const CUTOFF_DAY = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// tanggalInstalasiIso: "YYYY-MM-DD" (kolom `date` murni, sama pola
// dengan tanggal_mulai/tanggal_selesai Pengajuan Cuti) -- ditambah
// "T00:00:00" supaya di-parse sebagai waktu lokal, bukan UTC.
export function computeProrata(tanggalInstalasiIso: string, hargaNormal: number): number {
  const install = new Date(`${tanggalInstalasiIso}T00:00:00`);

  const cycleEnd =
    install.getDate() >= CUTOFF_DAY
      ? new Date(install.getFullYear(), install.getMonth() + 1, CUTOFF_DAY)
      : new Date(install.getFullYear(), install.getMonth(), CUTOFF_DAY);
  const cycleStart = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth() - 1, CUTOFF_DAY);

  const totalHariSiklus = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / MS_PER_DAY);
  const sisaHari = Math.round((cycleEnd.getTime() - install.getTime()) / MS_PER_DAY);

  if (totalHariSiklus <= 0) return hargaNormal;
  return Math.round((hargaNormal * sisaHari) / totalHariSiklus);
}

// Tagihan prorata cuma berlaku buat siklus pertama Pelanggan --
// mikrotik-daily-billing-cycle mengosongkan tagihan_prorata tiap tanggal
// 15 setelah jatuh tempo tanggal 3 siklus itu. Jadi kalau Tanggal
// Instalasi diisi/diedit setelah tanggal 15 itu lewat (mis. Pelanggan
// lama yang baru diinput belakangan), prorata-nya sudah kedaluwarsa dan
// Pelanggan ditagih harga normal -- jangan diisi lagi.
const RESET_DAY = 15;

export function computeTagihanProrata(
  tanggalInstalasiIso: string,
  hargaNormal: number,
  now: Date = new Date()
): number | null {
  const install = new Date(`${tanggalInstalasiIso}T00:00:00`);
  const cycleEndMonth =
    install.getDate() >= CUTOFF_DAY ? install.getMonth() + 1 : install.getMonth();
  const resetAt = new Date(install.getFullYear(), cycleEndMonth, RESET_DAY);

  if (now.getTime() >= resetAt.getTime()) return null;
  return computeProrata(tanggalInstalasiIso, hargaNormal);
}
