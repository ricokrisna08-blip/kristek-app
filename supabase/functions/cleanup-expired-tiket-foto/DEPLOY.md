# Deploy Edge Function "cleanup-expired-tiket-foto"

## 0. Kalau function ini sudah pernah di-deploy sebelumnya

Ini UPDATE, bukan create baru -- function-nya sekarang dikecualikan dari
menghapus foto checklist bukti Instalasi/Laporan Pelanggan (redaman/ont/
kabel_jalur), cuma before/after yang tetap kena retensi 7 hari. Buka
**Supabase Dashboard → Edge Functions → cleanup-expired-tiket-foto**,
paste ulang isi `index.ts` terbaru, Deploy. Lewati langkah 1 di bawah
(cron job-nya tidak perlu dibuat ulang kalau sudah ada).

## 1. Deploy function-nya (kalau belum pernah ada)

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `cleanup-expired-tiket-foto` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/cleanup-expired-tiket-foto/index.ts` dari repo ini.
5. Klik **Deploy**.

Tidak perlu setting env var manual (`SUPABASE_URL` dan
`SUPABASE_SERVICE_ROLE_KEY` sudah otomatis tersedia di semua Edge Function).

## 2. Jadwalkan supaya jalan otomatis tiap hari

1. Buka **Supabase Dashboard → Database → Cron Jobs** (kalau menu ini belum
   ada di project kamu, cari **Integrations → Cron** — nama menunya kadang
   beda tergantung versi Dashboard).
2. Klik **Create a new cron job**.
3. Isi:
   - **Name**: `cleanup-expired-tiket-foto`
   - **Schedule**: `0 3 * * *` (jalan tiap hari jam 3 pagi)
   - **Type**: HTTP Request (atau "Edge Function" kalau ada opsi khusus)
   - **Method**: POST
   - **URL**: `https://<project-ref>.supabase.co/functions/v1/cleanup-expired-tiket-foto`
     (ganti `<project-ref>` sesuai project kamu — bisa dilihat di Project
     Settings → General)
   - **Headers**: tambahkan header
     `Authorization: Bearer <service_role key>`
     (service_role key ada di Project Settings → API → `service_role` —
     **JANGAN** pernah taruh key ini di kode app, cuma di sini)
4. Simpan.

## Cara tes cepat setelah setup

Uji manual dulu sebelum menunggu jadwal jalan sendiri. Di terminal (ganti
`<project-ref>` dan `<service_role key>`):

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/cleanup-expired-tiket-foto" \
  -H "Authorization: Bearer <service_role key>"
```

Kalau berhasil, hasilnya `{"deleted": 0}` (atau angka lebih besar dari 0
kalau memang ada foto yang sudah lebih dari 7 hari). Kalau salah Authorization
header, hasilnya `{"error":"Unauthorized"}`.
