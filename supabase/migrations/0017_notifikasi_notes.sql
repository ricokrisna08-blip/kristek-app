-- Catatan (notes) yang diisi Teknisi saat menandai Tiket Pending sekarang
-- ikut disimpan di baris notifikasi, supaya Admin & Pemilik langsung lihat
-- isinya di lonceng notifikasi tanpa perlu buka layar lain.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0016.

alter table public.notifikasi
  add column if not exists notes text;
