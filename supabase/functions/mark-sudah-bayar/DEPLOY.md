# Deploy Edge Function "mark-sudah-bayar"

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `mark-sudah-bayar` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/mark-sudah-bayar/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. Secret

Pakai secret Mikrotik yang sama dengan `mikrotik-set-isolir` (`MIKROTIK_HOST`,
`MIKROTIK_API_USER`, `MIKROTIK_API_PASSWORD`, `MIKROTIK_CA_CERT`) — kalau itu
sudah di-set di project ini, tidak perlu diset ulang.

## Cara kerja

- Admin/Pemilik centang "Sudah Bayar Bulan Ini" di app → function ini
  update `sudah_bayar_bulan_ini = true`.
- Kalau Pelanggan itu **sedang berstatus isolir** saat dicentang, function
  ini otomatis memanggil Mikrotik buat meng-aktifkan lagi PPP secret-nya
  (`disabled: false`) dan mereset `is_isolir` ke `false` — jadi tidak perlu
  tombol "Cabut Isolir" terpisah lagi.
- Uncheck (`sudahBayar: false`) cuma update kolom, tidak pernah memicu
  isolir otomatis di sini.
- Kalau Pelanggan itu isolir tapi belum punya `mikrotik_username` ke-set,
  function ini menolak dengan pesan jelas (bukan diam-diam gagal) supaya
  Admin tahu harus mengisi Username Mikrotik dulu atau minta Pemilik cabut
  isolir manual.

## Cara tes cepat setelah setup

1. Cari Pelanggan test yang statusnya sedang **Terisolir** dan punya
   Username Mikrotik ke-set.
2. Centang "Sudah Bayar Bulan Ini" di layar detail-nya.
3. Refresh layar — "Status Isolir" harusnya berubah jadi "Aktif" tanpa
   perlu menekan tombol Isolir/Cabut Isolir terpisah.
4. Cek juga di Mikrotik (`/ppp/secret/print`) — PPP secret-nya harusnya
   `disabled=no`.
