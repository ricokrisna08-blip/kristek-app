-- Sebelumnya, Pelanggan yang punya Tiket APAPUN (termasuk yang sudah
-- Selesai/Dibatalkan) tidak bisa dihapus sama sekali -- foreign key
-- tiket.pelanggan_id menolak (RESTRICT, default Postgres) selama ada
-- baris tiket yang masih merujuk ke Pelanggan itu.
--
-- Perubahan: Pemilik sekarang boleh menghapus Pelanggan asalkan tidak ada
-- Tiket yang MASIH AKTIF (status selain 'selesai'/'dibatalkan') -- dicek di
-- level aplikasi (lihat src/pelanggan/deletePelanggan.ts). Supaya delete
-- itu benar-benar bisa jalan meski Pelanggan itu punya histori Tiket yang
-- sudah selesai/dibatalkan, foreign key-nya diubah jadi ON DELETE SET NULL
-- -- baris Tiket lama TETAP ADA (histori/laporan performa teknisi tidak
-- hilang), cuma pelanggan_id-nya jadi kosong begitu Pelanggan-nya dihapus.
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0023.

alter table public.tiket
  drop constraint if exists tiket_pelanggan_id_fkey;

alter table public.tiket
  add constraint tiket_pelanggan_id_fkey
  foreign key (pelanggan_id) references public.pelanggan (id) on delete set null;
