# Deploy Edge Function "delete-account"

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `delete-account` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/delete-account/index.ts` dari repo ini.
5. Klik **Deploy**.

Sama seperti `reset-password`, tidak perlu setting env var manual.

## Cara tes cepat setelah deploy

Login sebagai Pemilik → **Kelola Akun** → coba **Hapus** akun Admin/Teknisi
yang belum pernah dipakai sama sekali (belum pernah buat/ditugaskan Tiket).
Kalau akun itu sudah punya riwayat Tiket, harus muncul pesan "Akun ini masih
punya riwayat Tiket, tidak bisa dihapus." — bukan malah terhapus.
