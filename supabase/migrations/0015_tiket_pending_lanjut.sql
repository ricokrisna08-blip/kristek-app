-- Tiket 08: Teknisi bisa menandai Tiket Pending (wajib catatan) dan Lanjut
-- kembali ke Dikerjakan. Waktu selama Pending dikecualikan dari Durasi Kerja.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0014.

alter table public.tiket
  add column if not exists pending_started_at timestamptz;

-- Dibutuhkan supaya Teknisi bisa membuat notifikasi (type: pending) untuk
-- semua akun Pemilik saat Tiket masuk status Pending -- pola yang sama
-- dengan 0008 (Admin baca semua Teknisi lintas Wilayah).
create policy "authenticated users can read pemilik accounts"
  on public.users for select
  to authenticated
  using (role = 'pemilik');
