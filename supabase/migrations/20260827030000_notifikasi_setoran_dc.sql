-- Perluas notifikasi (0006, sudah diperluas sekali di 20260813064341 buat
-- pengajuan_cuti) supaya bisa juga dipakai buat setoran DC -- Pemilik
-- perlu tau begitu ada DC yang menandai Pelanggan sudah bayar ke dia.
alter table public.notifikasi
  add column if not exists pelanggan_id uuid references public.pelanggan (id) on delete cascade;

alter table public.notifikasi
  drop constraint if exists notifikasi_tiket_or_cuti_check;

alter table public.notifikasi
  add constraint notifikasi_tiket_or_cuti_or_pelanggan_check
  check (tiket_id is not null or cuti_id is not null or pelanggan_id is not null);
