-- Role baru "system" -- dipakai akun service dedicated buat daemon WA
-- Blast (system-wa-blast@internal.kristek.app), sebelumnya login pakai
-- role "pemilik" jadi ikut lihat semua menu Pemilik. Ditambah di file
-- TERPISAH dari migration yang memakainya (RLS di 20260828020000) karena
-- Postgres tidak izinkan value enum baru dipakai di transaksi yang sama
-- saat ditambahkan.
alter type public.user_role add value if not exists 'system';
