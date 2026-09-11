import type { SupabaseClient } from "@supabase/supabase-js";

export type LaporanBulananItem = {
  periode: string;
  label: string;
  totalUser: number;
  omset: number;
  sudahBayar: number;
  belumBayar: number;
  diTanganDc: number;
  totalPengeluaran: number;
  sisaUang: number;
  persen: number;
  isBulanIni: boolean;
  // Breakdown Pelanggan isolir -- ditampilkan TERPISAH (bukan di-exclude
  // diam-diam) supaya Pemilik bisa lihat berapa besar dampaknya. Cuma
  // terisi buat baris live "bulan ini"; baris histori (dari
  // laporan_bulanan, tidak menyimpan status isolir per Pelanggan) selalu 0.
  jumlahIsolir: number;
  angkaIsolir: number;
  pendapatanSetelahIsolir: number;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatPeriodeLabel(periode: string): string {
  const [year, month] = periode.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  const shortYear = year.slice(2);
  return `${MONTH_LABELS[monthIndex] ?? month}-${shortYear}`;
}

function persenOf(sudahBayar: number, omset: number): number {
  if (omset <= 0) return 0;
  return Math.round((sudahBayar / omset) * 1000) / 10;
}

// Siklus billing beneran (reset sudah_bayar_bulan_ini, snapshot
// laporan_bulanan) baru terjadi tanggal 15 -- lihat
// mikrotik-daily-billing-cycle, itu TIDAK berubah. Ini cuma soal kapan
// baris "bulan berjalan" di TAMPILAN Laporan Keuangan mulai nunjuk ke
// bulan kalender baru (permintaan Pemilik: tanggal 11, supaya Omset bulan
// baru kelihatan lebih awal) -- sebelum tanggal itu, tabelnya masih nunjuk
// ke bulan sebelumnya. Sengaja terpisah dari CUTOFF_DAY di
// computeProrata.ts (beda concern: itu ngitung prorata tagihan pertama).
const BULAN_INI_DISPLAY_CUTOFF_DAY = 11;

function currentPeriode(): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-12

  if (now.getDate() < BULAN_INI_DISPLAY_CUTOFF_DAY) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

// Pelanggan yang baru pasang di bulan kalender berjalan belum "resmi"
// nyumbang ke Omset bulan ini -- tagihan prorata pertamanya baru
// ditagihkan/dihitung mulai bulan berikutnya (permintaan Pemilik: supaya
// Total User/Omset bulan berjalan nggak keburu naik cuma karena ada
// instalasi baru beberapa hari terakhir). `tanggalInstalasiIso`:
// "YYYY-MM-DD" (kolom `date` murni).
function isInstalledThisCalendarMonth(tanggalInstalasiIso: string | null, now: Date): boolean {
  if (!tanggalInstalasiIso) return false;
  const install = new Date(`${tanggalInstalasiIso}T00:00:00`);
  return (
    install.getFullYear() === now.getFullYear() && install.getMonth() === now.getMonth()
  );
}

export async function getLaporanKeuangan(
  client: SupabaseClient
): Promise<LaporanBulananItem[]> {
  const [historyResult, pelangganResult, pengeluaranResult] = await Promise.all([
    client
      .from("laporan_bulanan")
      .select("periode, total_user, omset, sudah_bayar, belum_bayar")
      .order("periode", { ascending: true }),
    client
      .from("pelanggan")
      .select(
        "harga, tagihan_prorata, kompensasi_nominal, sudah_bayar_bulan_ini, dc_flagged_lunas, is_isolir, tanggal_instalasi"
      ),
    client.from("pengeluaran").select("nominal, persen, tanggal, sudah_dibayar"),
  ]);

  const history = historyResult.data ?? [];
  const items: LaporanBulananItem[] = history.map((row: any) => ({
    periode: row.periode,
    label: formatPeriodeLabel(row.periode),
    totalUser: row.total_user,
    omset: row.omset,
    sudahBayar: row.sudah_bayar,
    belumBayar: row.belum_bayar,
    // Snapshot bulanan (laporan_bulanan) tidak mencatat ini -- di titik
    // snapshot (tanggal 15), setoran DC yang masih menggantung sudah
    // di-reset (lihat mikrotik-daily-billing-cycle), jadi histori bulan
    // lalu memang tidak relevan buat metrik ini.
    diTanganDc: 0,
    totalPengeluaran: 0,
    sisaUang: row.sudah_bayar,
    persen: persenOf(row.sudah_bayar, row.omset),
    isBulanIni: false,
    jumlahIsolir: 0,
    angkaIsolir: 0,
    pendapatanSetelahIsolir: row.omset,
  }));

  // Total User & Omset baris live ikut SEMUA Pelanggan (termasuk yang
  // isolir) -- isolir TIDAK di-exclude diam-diam, tapi ditampilkan
  // terpisah lewat jumlahIsolir/angkaIsolir/pendapatanSetelahIsolir di
  // bawah supaya Pemilik bisa lihat dampaknya secara transparan. Pelanggan
  // yang baru pasang bulan kalender ini tetap ikut Total User (biar
  // langsung kelihatan begitu ada penambahan), tapi belum nyumbang ke
  // Omset/Sudah Bayar/Belum Bayar/Di Tangan DC (lihat
  // isInstalledThisCalendarMonth) -- tagihan pertama mereka baru resmi
  // masuk hitungan bulan depan.
  const now = new Date();
  const pelangganRows = pelangganResult.data ?? [];
  const totalUser = pelangganRows.length;
  let omset = 0;
  let sudahBayar = 0;
  let belumBayar = 0;
  let diTanganDc = 0;
  let jumlahIsolir = 0;
  let angkaIsolir = 0;
  for (const row of pelangganRows as any[]) {
    if (isInstalledThisCalendarMonth(row.tanggal_instalasi, now)) continue;

    const dasar = row.tagihan_prorata ?? row.harga ?? 0;
    const tagihan = Math.max(dasar - (row.kompensasi_nominal ?? 0), 0);
    omset += tagihan;

    if (row.is_isolir) {
      jumlahIsolir += 1;
      angkaIsolir += tagihan;
    }

    if (row.sudah_bayar_bulan_ini) {
      sudahBayar += tagihan;
    } else {
      belumBayar += tagihan;
      // Uang yang sudah dicentang DC ("sudah bayar ke saya") tapi belum
      // di-approve Pemilik -- masih terhitung "belum bayar" di sistem
      // (RLS/downstream lain belum berubah), tapi fisiknya sudah di
      // tangan DC, bukan lagi di Pelanggan. Ditampilkan terpisah supaya
      // Pemilik bisa lihat berapa yang perlu ditagih ke DC, bukan ke
      // Pelanggan lagi.
      if (row.dc_flagged_lunas) {
        diTanganDc += tagihan;
      }
    }
  }

  const periode = currentPeriode();
  items.push({
    periode,
    label: formatPeriodeLabel(periode),
    totalUser,
    omset,
    sudahBayar,
    belumBayar,
    diTanganDc,
    totalPengeluaran: 0,
    sisaUang: sudahBayar,
    persen: persenOf(sudahBayar, omset),
    isBulanIni: true,
    jumlahIsolir,
    angkaIsolir,
    pendapatanSetelahIsolir: omset - angkaIsolir,
  });

  const pengeluaranRows = (pengeluaranResult.data ?? []) as any[];

  // laporan_bulanan cuma keisi kalau snapshot tanggal 15 sempat jalan --
  // kalau cron itu gagal/belum sempat jalan di suatu bulan, bulan itu
  // hilang dari `items` walau baris Pengeluaran-nya sendiri tetap aman di
  // tabel `pengeluaran`. Tanpa ini, bulan itu jadi tidak bisa dipilih sama
  // sekali di app -- kelihatan kayak "hilang" padahal cuma nggak ada pill
  // buat munculinnya.
  const knownPeriode = new Set(items.map((item) => item.periode));
  for (const row of pengeluaranRows) {
    const periodeKey = `${String(row.tanggal).slice(0, 7)}-01`;
    if (knownPeriode.has(periodeKey)) continue;
    knownPeriode.add(periodeKey);
    items.push({
      periode: periodeKey,
      label: formatPeriodeLabel(periodeKey),
      totalUser: 0,
      omset: 0,
      sudahBayar: 0,
      belumBayar: 0,
      diTanganDc: 0,
      totalPengeluaran: 0,
      sisaUang: 0,
      persen: 0,
      isBulanIni: false,
      jumlahIsolir: 0,
      angkaIsolir: 0,
      pendapatanSetelahIsolir: 0,
    });
  }
  items.sort((a, b) => (a.periode < b.periode ? -1 : a.periode > b.periode ? 1 : 0));

  // Tampilkan cuma 3 bulan terakhir (termasuk bulan berjalan yang live).
  const shown = items.slice(-3);

  // Pengeluaran (gaji, bandwidth, bagi hasil investor, dll) dicatat per
  // tanggal asli (bukan snapshot per-siklus kayak laporan_bulanan), jadi
  // totalnya bisa dihitung LANGSUNG dari tabel pengeluaran buat periode
  // manapun yang ditampilkan -- termasuk bulan-bulan histori.
  const sudahBayarByPeriode = new Map(shown.map((item) => [item.periode, item.sudahBayar]));
  const totalByPeriode = new Map<string, number>();

  for (const row of pengeluaranRows) {
    if (!row.sudah_dibayar) continue;
    const periodeKey = `${String(row.tanggal).slice(0, 7)}-01`;
    const sudahBayarPeriode = sudahBayarByPeriode.get(periodeKey) ?? 0;
    const efektif =
      row.nominal != null ? row.nominal : Math.round((sudahBayarPeriode * row.persen) / 100);
    totalByPeriode.set(periodeKey, (totalByPeriode.get(periodeKey) ?? 0) + efektif);
  }

  for (const item of shown) {
    item.totalPengeluaran = totalByPeriode.get(item.periode) ?? 0;
    item.sisaUang = item.sudahBayar - item.totalPengeluaran;
  }

  return shown;
}
