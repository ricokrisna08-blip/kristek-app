-- Pengeluaran sekarang dua tahap: dicatat dulu sebagai rencana (list),
-- baru dicentang "Sudah Dibayar" begitu beneran dibayar. Cuma baris yang
-- sudah_dibayar = true yang kehitung ke kolom Pengeluaran/Sisa Uang di
-- Laporan Keuangan (lihat getLaporanKeuangan.ts) -- baris yang belum
-- dicentang tetap muncul di list tapi belum dianggap "keluar".
alter table public.pengeluaran
  add column if not exists sudah_dibayar boolean not null default false;
