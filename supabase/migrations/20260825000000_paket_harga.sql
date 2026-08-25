-- Tambah kolom harga ke katalog Paket, supaya Pelanggan baru yang dibuat
-- lewat Buat Tiket > Instalasi otomatis kewarisan harga dari Paket yang
-- dipilih (bisa di-override manual belakangan lewat "Edit Harga
-- Langganan" di layar detail Pelanggan, misal ada subsidi/nego -- lihat
-- migration 20260101200000_pelanggan_harga.sql).
alter table public.paket
  add column if not exists harga integer;
