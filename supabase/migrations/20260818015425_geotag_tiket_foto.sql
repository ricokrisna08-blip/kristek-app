-- Geotag foto bukti pekerjaan: koordinat GPS device Teknisi PAS foto
-- diambil (bukan alamat Pelanggan yang tersimpan) -- nullable karena izin
-- lokasi bisa ditolak Teknisi, dan foto lama (sebelum kolom ini ada) tidak
-- punya data ini.
alter table public.tiket_foto
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
