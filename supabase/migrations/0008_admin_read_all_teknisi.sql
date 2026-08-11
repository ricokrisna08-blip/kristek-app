-- Fix: Admin belum pernah punya izin baca akun Teknisi sama sekali (RLS
-- users cuma izinkan baca profil sendiri + Pemilik baca semua), jadi daftar
-- Teknisi di layar Buat Tiket selalu kosong.
--
-- Sekaligus terapkan permintaan: Admin boleh lihat & assign Teknisi dari
-- WILAYAH MANAPUN (bukan cuma Wilayah sendiri) -- beda dari pola Wilayah-
-- scoping yang dipakai di ODP/Pelanggan/Tiket. RLS insert tiket_teknisi
-- (0007) memang tidak pernah membatasi wilayah teknisi yang di-assign, jadi
-- ini konsisten -- yang kurang cuma izin baca-nya.
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0007.

create policy "admin can read all teknisi accounts across wilayah"
  on public.users for select
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and role = 'teknisi'
  );
