# Deploy Edge Function "mikrotik-end-connection"

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `mikrotik-end-connection` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/mikrotik-end-connection/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. Secret

Function ini pakai secret Mikrotik yang **sama** dengan `mikrotik-set-isolir`
(`MIKROTIK_HOST`, `MIKROTIK_API_USER`, `MIKROTIK_API_PASSWORD`,
`MIKROTIK_CA_CERT`) — kalau itu sudah di-set di project ini, tidak perlu
diset ulang. Kalau belum, lihat DEPLOY.md di folder `mikrotik-set-isolir`.

## Cara tes cepat setelah setup

Dari app: buka detail Pelanggan yang sudah punya Username Mikrotik
ke-set dan sedang online (ada active connection-nya di Mikrotik), login
sebagai Pemilik, tekan tombol "Putus Koneksi". Cek di Mikrotik
(`/ppp/active/print`) — koneksi pelanggan itu harusnya langsung hilang
dari daftar active connection. Kalau pelanggan itu tidak sedang online,
tombol ini tidak melakukan apa-apa (bukan error) — tidak ada yang perlu
diputus.
