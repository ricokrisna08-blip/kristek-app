-- Bulk import Pelanggan Agustus 2026: ODP belum di-assign per rumah saat
-- data pertama kali dimasukkan (menyusul, per pelanggan), jadi kolom ini
-- perlu boleh kosong dulu. Sebelumnya wajib diisi sejak awal (0005).
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0024.

alter table public.pelanggan
  alter column odp_id drop not null;
