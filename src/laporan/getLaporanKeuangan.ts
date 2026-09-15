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

// Baris "bulan ini" SELALU ngikutin bulan kalender hari ini, nggak nunggu
// tanggal berapa pun -- siklus billing beneran (reset tanggal 15, lihat
// mikrotik-daily-billing-cycle) tetap jalan apa adanya di belakang layar,
// tapi TAMPILAN live-nya (Sudah Bayar/Belum Bayar dst di bawah, per
// centangan Pelanggan saat ini) harus selalu kelihatan langsung begitu
// ada perubahan, kapan pun tanggalnya -- termasuk yang telat bayar
// mepet tanggal 14 sekalipun.
function currentPeriode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  return `${year}-${String(month).padStart(2, "0")}-01`;
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
        "harga, tagihan_prorata, kompensasi_nominal, sudah_bayar_bulan_ini, dc_flagged_lunas, is_isolir"
      ),
    client.from("pengeluaran").select("nominal, persen, tanggal, sudah_dibayar"),
  ]);

  const periode = currentPeriode();

  // Snapshot laporan_bulanan buat periode BERJALAN sendiri (kalau tanggal
  // 15 sudah lewat hari ini) sengaja DIABAIKAN di sini -- baris "bulan
  // ini" harus tetap LIVE (pembayaran yang baru masuk setelah reset
  // langsung kelihatan), bukan beku di angka pas-reset-tadi-pagi. Baris
  // histori beneran cuma buat bulan-bulan yang SUDAH LEWAT dari periode
  // berjalan.
  const history = (historyResult.data ?? []).filter((row: any) => row.periode !== periode);
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

  // Total User & Omset baris live ikut SEMUA Pelanggan (termasuk yang baru
  // pasang bulan ini dan yang lagi isolir) -- keduanya bergerak bareng,
  // nggak ada exclude diam-diam. Isolir ditampilkan terpisah lewat
  // jumlahIsolir/angkaIsolir/pendapatanSetelahIsolir di bawah supaya
  // Pemilik bisa lihat dampaknya secara transparan tanpa Omset jadi
  // ganjil dibanding Total User.
  const pelangganRows = pelangganResult.data ?? [];
  const totalUser = pelangganRows.length;
  let omset = 0;
  let sudahBayar = 0;
  let belumBayar = 0;
  let diTanganDc = 0;
  let jumlahIsolir = 0;
  let angkaIsolir = 0;
  for (const row of pelangganRows as any[]) {
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
