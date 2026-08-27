-- File terpisah dari 20260827030000 -- Postgres tidak izinkan value enum
-- baru dipakai di transaksi yang sama saat ditambahkan.
alter type public.notifikasi_type add value if not exists 'setoran_dc';
