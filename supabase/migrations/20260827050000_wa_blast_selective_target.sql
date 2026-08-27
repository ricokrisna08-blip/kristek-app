-- Dua kebutuhan buat manual trigger WA Blast Tagihan ke Pelanggan
-- tertentu (bukan selalu semua yang belum bayar):
--
-- 1. sudah_diblast_bulan_ini/diblast_at -- nyatet Pelanggan yang SUDAH
--    kekirim pesan tagihan bulan ini (manual maupun scheduler), supaya
--    blast-penuh berikutnya (baik dipicu manual atau cron bulanan) skip
--    orang yang udah kekirim, bukan kirim ulang.
-- 2. wa_blast_job.pelanggan_ids -- kalau diisi, job itu cuma nargetin
--    Pelanggan-Pelanggan itu (dipilih manual lewat picker di app),
--    nggak peduli sudah_diblast_bulan_ini-nya (resend eksplisit selalu
--    diizinkan). Kalau null (default, termasuk job dari cron bulanan),
--    tetap mode lama: semua yang belum bayar & belum di-blast.
alter table public.pelanggan
  add column if not exists sudah_diblast_bulan_ini boolean not null default false,
  add column if not exists diblast_at timestamptz;

alter table public.wa_blast_job
  add column if not exists pelanggan_ids uuid[];
