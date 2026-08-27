-- Role baru "DC" (Debt Collector / Penagih) -- akun lapangan yang cuma
-- boleh lihat Pelanggan belum bayar & menandai "sudah bayar ke saya",
-- menunggu approve Pemilik. Ditambah di file TERPISAH dari migration yang
-- memakainya (RLS/RPC di 20260827020000) karena Postgres tidak izinkan
-- value enum baru dipakai di transaksi yang sama saat ditambahkan.
alter type public.user_role add value if not exists 'dc';
