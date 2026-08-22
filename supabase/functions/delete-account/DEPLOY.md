# Deploy Edge Function "delete-account"

## 1. Jalankan migration dulu

Sebelum re-deploy function-nya, jalankan migration
`supabase/migrations/20260822000000_relax_user_fk_for_account_deletion.sql`
lewat **Supabase Dashboard → SQL Editor** (paste isinya, Run). Ini
melepas foreign key yang selama ini bikin hapus akun gagal walau semua
Tiket-nya sudah Selesai, dan nyalin nama Teknisi ke kolom snapshot biar
Laporan Performa & Daftar Pengajuan Cuti tetap nampilin namanya walau
akunnya sudah dihapus.

## 2. Update function-nya (bukan bikin baru)

Function `delete-account` sudah pernah di-deploy sebelumnya -- ini
UPDATE, bukan create baru:

1. Buka **Supabase Dashboard → Edge Functions → delete-account**.
2. Buka tab **Code** / edit function.
3. Hapus isi lama, paste seluruh isi file
   `supabase/functions/delete-account/index.ts` dari repo ini (versi
   terbaru).
4. Klik **Deploy**.

Sama seperti `reset-password`, tidak perlu setting env var manual.

## Cara tes cepat setelah deploy

Login sebagai Pemilik → **Kelola Akun** → coba **Hapus**:

- Akun yang masih punya Tiket **aktif** (ditugaskan/pending/dikerjakan) →
  harus ditolak dengan pesan "Akun ini masih punya Tiket yang belum
  selesai (ditugaskan/dikerjakan/pending), tidak bisa dihapus."
- Akun yang seluruh Tiket-nya sudah **Selesai/Dibatalkan** (atau belum
  pernah punya Tiket sama sekali) → harus berhasil terhapus.
- Setelah akun ke-hapus, cek Laporan Performa & (kalau akunnya Teknisi
  yang pernah ajukan cuti) Daftar Pengajuan Cuti -- nama Teknisi itu
  harus tetap muncul di histori lama, bukan kosong/hilang.
