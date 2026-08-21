# Deploy Edge Function "send-push-notification"

Function ini yang bikin notifikasi (Tiket ditugaskan/pending/selesai, cuti
diajukan) muncul di notification tray HP -- Android (APK) dan browser
(Web) -- bukan cuma badge lonceng in-app. Dipanggil langsung dari app
(`src/notifikasi/triggerPushNotification.ts`) tiap kali ada notifikasi
baru -- **bukan** lewat Database Webhook (project ini belum punya schema
`supabase_functions` yang dibutuhkan fitur itu, jadi didesain ulang supaya
tidak bergantung ke situ).

Sampai kedua langkah di bawah ini selesai, notifikasi tetap jalan seperti
biasa (badge lonceng), cuma belum ada push ke tray.

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `send-push-notification` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/send-push-notification/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. VAPID key (buat push ke browser)

VAPID public key **sudah** digenerate dan sudah diisi ke `.env` lokal +
env var Vercel (`EXPO_PUBLIC_VAPID_PUBLIC_KEY`, tidak rahasia -- aman
kelihatan di client). Private key-nya **tidak ditulis di file ini atau di
mana pun di repo** -- Rico sudah punya keypair-nya dari sesi generate
sebelumnya (chat, bukan file). Kalau perlu generate ulang, jalankan
`npx web-push generate-vapid-keys` dan update
`EXPO_PUBLIC_VAPID_PUBLIC_KEY` di `.env` + Vercel env supaya client pakai
public key yang sama dengan yang di-set di Edge Function secret.

Set 3 secret berikut di **Supabase Dashboard → Edge Functions →
Secrets**:

- `VAPID_PUBLIC_KEY` — sama dengan `EXPO_PUBLIC_VAPID_PUBLIC_KEY` di atas.
- `VAPID_PRIVATE_KEY` — pasangan private key-nya (dari chat/generate
  ulang, JANGAN pernah taruh di file yang di-commit).
- `VAPID_SUBJECT` — `mailto:` + email kamu, misal
  `mailto:ricokrisna08@gmail.com` (syarat protokol Web Push, dipakai push
  service buat kontak balik kalau ada masalah, bukan dikirim ke user).

## 3. Tes end-to-end lewat app (bukan curl)

Function ini butuh Authorization header berisi access token USER yang
login (dicek lewat `auth.getUser()`, sama seperti fungsi Mikrotik lain di
project ini) -- bukan `service_role` key, jadi tidak praktis dites lewat
curl manual tanpa login dulu. Cara paling gampang: tes langsung dari app
setelah kedua langkah di atas selesai dan APK/Web sudah versi terbaru
(sudah include `triggerPushNotification`):

1. Login di APK atau Web (device/browser ini otomatis daftar token/
   subscription push-nya ke tabel `push_subscriptions`).
2. Assign Tiket baru ke Teknisi (atau ajukan cuti/izin) dari device/akun
   lain.
3. Notifikasi harusnya muncul di tray HP/browser device tadi dalam
   beberapa detik.

Kalau tidak muncul, cek **Supabase Dashboard → Edge Functions →
send-push-notification → Logs** buat lihat error-nya (mis. VAPID belum
diset, atau `push_subscriptions` masih kosong buat user itu berarti
belum pernah login di versi app yang sudah punya fitur ini).

## 4. Catatan APK

`expo-notifications` nambah native module -- **APK yang sudah ter-install
sekarang belum punya ini**. Perlu build ulang
(`eas build --platform android --profile preview`) dan install ulang
sebelum push notification jalan di HP Android.
