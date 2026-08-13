# Deploy Edge Function "mikrotik-daily-billing-cycle"

⚠️ Ini function yang **otomatis motong internet pelanggan**. Siklus
billing KRISTEK: jatuh tempo tanggal 3, masa tenggang sampai tanggal 6,
kalau belum bayar diisolir otomatis jam 00:00 WIB tanggal 7. Status
"Sudah Bayar" di-reset tanggal 15 (bukan awal siklus, cuma ngosongin
status biar siap dipakai lagi buat siklus jatuh-tempo berikutnya). Baca
seluruh file ini sebelum lanjut ke bagian jadwal cron.

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `mikrotik-daily-billing-cycle` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/mikrotik-daily-billing-cycle/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. Set kredensial Mikrotik sebagai secret

Sama seperti `mikrotik-set-isolir` — lihat DEPLOY.md di folder itu untuk
cara bikin user API khusus (bukan akun admin utama), cara setup
certificate `www-ssl` yang benar (dua certificate terpisah, CA + leaf),
dan cara set 4 secret: `MIKROTIK_HOST`, `MIKROTIK_API_USER`,
`MIKROTIK_API_PASSWORD`, `MIKROTIK_CA_CERT`.

Selama secret ini belum diset, function tetap bisa jalan (reset tanggal 15
tetap jalan karena tidak butuh Mikrotik), tapi isolir tanggal 7-14 akan
gagal dengan pesan jelas per Pelanggan di `failed[]` pada response — tidak
ada Pelanggan yang ke-isolir tanpa kredensial valid.

## 3. Tes manual dulu SEBELUM jadwalkan cron

Ini langkah paling penting. Jangan lompat ke bagian jadwal cron sebelum
kamu tes manual dan baca responsnya baik-baik.

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/mikrotik-daily-billing-cycle" \
  -H "Authorization: Bearer <service_role key>"
```

Ganti `<project-ref>` (Project Settings → General) dan `<service_role key>`
(Project Settings → API). Perhatikan responsnya (tergantung tanggal hari
ini saat kamu tes):

- Kalau tanggal hari ini 1-6 atau 15-31 (di luar jendela isolir):
  `{"action":"none","reason":"outside jendela isolir (7-14)"}` — aman,
  tidak ada aksi (kecuali tanggal 15, lihat di bawah).
- Kalau tanggal 15: `{"action":"reset","resetCount":N}` — mereset N
  Pelanggan yang tadinya "Sudah Bayar" balik ke "Belum Bayar".
- Kalau tanggal 7-14: `{"action":"isolir","isolirCount":N,"failed":[...]}`
  — **ini yang benar-benar memutus akses N Pelanggan**. Cek dulu
  `isolirCount` masuk akal (bandingkan manual ke daftar Pelanggan yang
  belum centang "Sudah Bayar Bulan Ini" di app) sebelum percaya penuh ke
  function ini. Jendela 7-14 (bukan cuma tanggal 7) sengaja dibuat sebagai
  jaring pengaman kalau cron sempat gagal jalan pas tanggal 7 persis —
  Pelanggan yang sudah `is_isolir=true` otomatis dilewati di hari-hari
  berikutnya, jadi tidak dobel-isolir.

Kalau kamu ingin uji coba tanpa resiko motong pelanggan asli, uji dulu
pakai 1-2 akun PPP secret test di Mikrotik (bukan pelanggan aktif) yang
di-mikrotik_username-kan ke satu Pelanggan dummy di app.

## 4. Jadwalkan supaya jalan otomatis tiap hari

Baru lakukan ini setelah langkah 3 di atas kamu pahami dan hasilnya sesuai
ekspektasi.

1. Buka **Supabase Dashboard → Database → Cron Jobs** (atau
   **Integrations → Cron**).
2. Klik **Create a new cron job**.
3. Isi:
   - **Name**: `mikrotik-daily-billing-cycle`
   - **Schedule**: `5 17 * * *` (jalan tiap hari jam 00:05 WIB — cron
     Supabase pakai UTC, WIB = UTC+7, jadi jam 17:05 UTC hari sebelumnya =
     00:05 WIB. Dipilih deket jam 00:00 WIB tanggal 7 sesuai aturan
     bisnisnya, dengan jeda 5 menit biar tidak persis di titik pergantian
     hari)
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://<project-ref>.supabase.co/functions/v1/mikrotik-daily-billing-cycle`
   - **Headers**: `Authorization: Bearer <service_role key>`
4. Simpan.

Sebelum ini disimpan, **tidak ada isolir atau reset otomatis yang terjadi
sama sekali** — function ini cuma jalan kalau dipanggil manual (langkah 3)
atau lewat cron yang kamu setup sendiri di sini.
