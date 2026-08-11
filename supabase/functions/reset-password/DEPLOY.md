# Deploy Edge Function "reset-password"

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function** (atau **Deploy a new function**).
3. Nama function: `reset-password` (harus persis ini — kode di app manggil
   nama ini).
4. Buka file `index.ts` di editor yang muncul, **hapus isi default**, lalu
   paste seluruh isi file `supabase/functions/reset-password/index.ts` dari
   repo ini.
5. Klik **Deploy**.

Tidak perlu setting env var manual — `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
dan `SUPABASE_SERVICE_ROLE_KEY` otomatis tersedia di semua Edge Function di
project Anda.

## Cara tes cepat setelah deploy (opsional)

Login sebagai Pemilik di app, lalu di layar **Kelola Akun** klik tombol
**Reset Password** pada salah satu akun Admin/Teknisi. Kalau muncul error
"Hanya Pemilik yang boleh reset password" padahal Anda login sebagai
Pemilik, cek lagi apakah function-nya sudah ke-deploy dengan benar (bisa
dicek di tab **Logs** pada halaman function tersebut).
