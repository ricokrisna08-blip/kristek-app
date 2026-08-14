# Deploy Edge Function "mikrotik-delete-secret"

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `mikrotik-delete-secret` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/mikrotik-delete-secret/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. Secret

Function ini pakai secret Mikrotik yang **sama** dengan `mikrotik-set-isolir`
(`MIKROTIK_HOST`, `MIKROTIK_API_USER`, `MIKROTIK_API_PASSWORD`,
`MIKROTIK_CA_CERT`) — kalau itu sudah di-set di project ini, tidak perlu
diset ulang. Kalau belum, lihat DEPLOY.md di folder `mikrotik-set-isolir`.

## Cara tes cepat setelah setup

Dari app: buka detail Pelanggan yang punya Username Mikrotik ke-set, login
sebagai Pemilik, tekan "Hapus Pelanggan" lalu konfirmasi. Cek di Mikrotik
(`/ppp/secret/print`) — secret-nya harusnya langsung hilang dari router,
bukan cuma dari app. Kalau Pelanggan itu belum punya Username Mikrotik,
proses hapus tetap jalan normal (tidak ada yang perlu dihapus di router).

Function ini dipanggil **sebelum** baris Pelanggan-nya dihapus dari
database (lihat `deletePelanggan.ts` / `PelangganManagementScreen.tsx`) --
kalau hapus di Mikrotik gagal (mis. router tidak bisa dihubungi), proses
hapus Pelanggan di app ikut dibatalkan (bukan lanjut hapus baris DB-nya
saja) supaya tidak ada secret yatim yang ketinggalan aktif di router tanpa
ada Pelanggan yang terhubung ke situ lagi di app.
