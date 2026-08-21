# Deploy Edge Function "send-push-notification"

Function ini yang bikin notifikasi (Tiket ditugaskan/pending/selesai, cuti
diajukan) muncul di notification tray HP -- Android (APK) dan browser
(Web) -- bukan cuma badge lonceng in-app. Sampai ketiga langkah di bawah
ini selesai, notifikasi tetap jalan seperti biasa (badge lonceng), cuma
belum ada push ke tray.

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

## 3. Database Webhook (pemicu otomatis)

1. Buka **Supabase Dashboard → Database → Webhooks**.
2. Klik **Create a new hook**.
3. Isi:
   - **Name**: `notifikasi-push`
   - **Table**: `public.notifikasi`
   - **Events**: centang **Insert** saja.
   - **Type**: **Supabase Edge Functions**, pilih function
     `send-push-notification`.
   - **HTTP Headers**: tambah header `Authorization` dengan value
     `Bearer <service_role key>` (Project Settings → API → service_role
     secret) -- ini yang dicek function-nya di `index.ts`, tanpa ini
     semua request ditolak 401.
4. Klik **Create webhook**.

## 4. Tes manual

Ambil satu `id` baris dari tabel `notifikasi` (SQL Editor:
`select id, user_id from public.notifikasi order by created_at desc limit 1;`),
lalu:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-push-notification" \
  -H "Authorization: Bearer <service_role key>" \
  -H "Content-Type: application/json" \
  -d '{"record": {"id": "<notifikasi-id-dari-query-di-atas>"}}'
```

Response `{"sent": N, "results": [...]}` -- kalau `N` masih 0, berarti
user itu belum punya baris di `push_subscriptions` (belum pernah login di
APK/Web versi baru). Login dulu di APK atau Web supaya token/subscription
ke-daftar, baru tes ulang.

## 5. Catatan APK

`expo-notifications` nambah native module -- **APK yang sudah ter-install
sekarang belum punya ini**. Perlu build ulang
(`eas build --platform android --profile preview`) dan install ulang
sebelum push notification jalan di HP Android.
