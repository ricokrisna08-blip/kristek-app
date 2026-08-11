-- Improvement: alur Buat Tiket beda per Jenis --
--   Instalasi: tidak pilih Pelanggan lama, isi Pelanggan baru langsung.
--   Gangguan-Komplain: pilih Pelanggan lama + kolom Keluhan (wajib).
--   Maintenance: tidak terikat Pelanggan sama sekali, pilih ODP + kolom
--     Deskripsi Pekerjaan (wajib).
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0009.

-- pelanggan_id jadi nullable karena Maintenance tidak terikat Pelanggan.
alter table public.tiket
  alter column pelanggan_id drop not null;

alter table public.tiket
  add column if not exists odp_id uuid references public.odp (id),
  add column if not exists keluhan text,
  add column if not exists deskripsi_pekerjaan text;
