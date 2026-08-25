-- Status & subsidi manual per-Pelanggan, dikelola Pemilik di layar Detail
-- Pelanggan (bukan default dari Paket -- nominal subsidi bisa beda-beda
-- per orang meski Paket-nya sama, sama seperti kolom harga).
alter table public.pelanggan
  add column if not exists is_active boolean not null default true,
  add column if not exists is_benefit boolean not null default false,
  add column if not exists subsidi_aktif integer,
  add column if not exists prorate boolean not null default false;
