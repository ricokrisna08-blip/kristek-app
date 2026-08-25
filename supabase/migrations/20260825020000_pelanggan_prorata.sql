-- Tanggal Instalasi + tagihan bulan pertama (prorata), diisi otomatis
-- saat Tiket Instalasi dibuat (lihat createPelanggan.ts). tagihan_prorata
-- di-reset ke null oleh mikrotik-daily-billing-cycle setiap tanggal 15
-- (siklus tagihan berikutnya) -- lihat komentar di Edge Function itu.
alter table public.pelanggan
  add column if not exists tanggal_instalasi date,
  add column if not exists tagihan_prorata integer;
