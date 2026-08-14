# Deploy Edge Function "mikrotik-create-secret"

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `mikrotik-create-secret` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/mikrotik-create-secret/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. Secret

Function ini pakai secret Mikrotik yang **sama** dengan `mikrotik-set-isolir`
(`MIKROTIK_HOST`, `MIKROTIK_API_USER`, `MIKROTIK_API_PASSWORD`,
`MIKROTIK_CA_CERT`) — kalau itu sudah di-set di project ini, tidak perlu
diset ulang. Kalau belum, lihat DEPLOY.md di folder `mikrotik-set-isolir`.

## 3. Isi Nama Profile Mikrotik di tiap Paket

Function ini butuh kolom `paket.mikrotik_profile` (ditambah lewat migration
`20260813143624_sinkron_paket_mikrotik.sql`) buat tau Profile PPP apa yang
dipakai pas bikin secret baru. Kalau nambah Paket baru belakangan, jangan
lupa isi `mikrotik_profile` dengan nama Profile PPP yang **persis sama**
(case-sensitive) dengan yang ada di Mikrotik (`/ppp/profile/print`) —
Pelanggan dengan Paket yang `mikrotik_profile`-nya kosong akan ditolak
dengan pesan jelas, bukan gagal diam-diam.

## Catatan: siapa yang boleh pakai & perilaku create-vs-link

Bisa dipanggil oleh **Admin maupun Pemilik** (bukan cuma Pemilik). Function
ini cek dulu ke Mikrotik apakah secret dengan nama itu sudah ada:
- **Belum ada** -> dibuatkan baru (`service=pppoe`, password konvensi
  KRISTEK, profile sesuai Paket-nya).
- **Sudah ada** (misal pelanggan lama yang secret-nya dibuat manual di
  Winbox sebelum fitur ini ada) -> langsung di-link, tidak dibuatkan
  duplikat.

Pelanggan yang **sudah** punya Username Mikrotik tersimpan juga boleh
diubah (dipakai buat koreksi typo) -- secret LAMA di Mikrotik (kalau
namanya beda dari yang baru) sengaja dibiarkan apa adanya, tidak
ikut dihapus/di-rename otomatis. Response `renamedFrom` berisi username
lama kalau ini memang perubahan, supaya UI bisa ingetin Admin/Pemilik buat
cek manual apakah secret lama itu perlu dibereskan di Mikrotik.

## Cara tes cepat setelah setup

Dari app: buka detail Pelanggan yang **belum** punya Username Mikrotik dan
sudah dipasangkan ke Paket yang `mikrotik_profile`-nya sudah terisi, login
sebagai Admin atau Pemilik, isi Username Mikrotik, tekan "Simpan Username
Mikrotik". Cek di Mikrotik (`/ppp/secret/print`) — secret baru harusnya
langsung muncul dengan `service=pppoe` dan profile sesuai Paket-nya. Kalau
Paket-nya belum ada `mikrotik_profile`, harus muncul pesan error yang jelas
— bukan secret yang salah/kosong.
