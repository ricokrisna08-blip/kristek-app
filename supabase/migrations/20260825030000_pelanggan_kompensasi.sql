-- Kompensasi gangguan -- Pemilik input LAMA GANGGUAN (hari), nominalnya
-- dihitung otomatis (lihat computeKompensasi.ts) dari Harga Langganan
-- saat ini dibagi total hari siklus tagihan berjalan (siklus tanggal 3
-- ke tanggal 3, sama seperti computeProrata.ts). Nggak nimpa kolom
-- harga -- cuma dikurangkan dari tagihan yang ditampilkan/di-blast WA
-- bulan ini (lihat fetchBillingFromSupabase.ts di kristek-wa-blast), lalu
-- di-reset oleh mikrotik-daily-billing-cycle di tanggal 15 (satu siklus
-- aja, sama seperti tagihan_prorata).
alter table public.pelanggan
  add column if not exists kompensasi_hari integer,
  add column if not exists kompensasi_nominal integer;
