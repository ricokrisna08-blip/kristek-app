# Deploy Edge Function "mikrotik-set-isolir"

## 1. Deploy function-nya

1. Buka **Supabase Dashboard → Edge Functions**.
2. Klik **Create a new function**.
3. Nama function: `mikrotik-set-isolir` (harus persis ini).
4. Hapus isi default, paste seluruh isi file
   `supabase/functions/mikrotik-set-isolir/index.ts` dari repo ini.
5. Klik **Deploy**.

## 2. Set kredensial Mikrotik sebagai secret

**Jangan** taruh kredensial ini di kode app atau commit ke git. Function ini
gagal dengan pesan jelas ("Kredensial Mikrotik belum diset") kalau
secret-nya belum ada — aman, tidak ada isolir yang terjadi sampai langkah
ini selesai.

1. Buka **Supabase Dashboard → Edge Functions → Secrets** (atau **Manage
   secrets**, tergantung versi Dashboard).
2. Tambahkan 4 secret:
   - `MIKROTIK_HOST` — IP atau hostname DDNS router kamu **plus port
     service `www-ssl`** (bukan port Winbox!), tanpa `https://`, misal
     `202.47.185.47:443`
   - `MIKROTIK_API_USER` — username dari user API khusus yang kamu buat di
     Mikrotik (**bukan** akun admin utama — lihat catatan keamanan di
     bawah)
   - `MIKROTIK_API_PASSWORD` — password user API tersebut
   - `MIKROTIK_CA_CERT` — isi certificate CA yang menandatangani
     certificate `www-ssl` kamu (dari `-----BEGIN CERTIFICATE-----` sampai
     `-----END CERTIFICATE-----`, lihat catatan certificate di bawah).
     Ini **bukan** data rahasia (certificate itu publik, beda dari private
     key), tapi tetap perlu di-set supaya Deno mau mempercayai certificate
     self-signed kamu — tanpa ini errornya `UnknownIssuer`.

### Catatan certificate: kenapa perlu MIKROTIK_CA_CERT

Karena kamu belum punya domain/DDNS buat certificate resmi (Let's
Encrypt dkk), certificate `www-ssl` di RouterOS itu self-signed. Deno
(runtime Edge Function) menolak certificate self-signed secara default.

Setup certificate yang benar di RouterOS (dua certificate terpisah,
**bukan satu** — certificate CA tidak boleh dipakai langsung jadi
certificate server, ditolak dengan error `CaUsedAsEndEntity`):

```
/certificate add name=my-ca common-name=my-ca key-usage=key-cert-sign,crl-sign
/certificate sign my-ca
/certificate add name=www-ssl-leaf common-name=<IP-router-kamu> key-usage=tls-server
/certificate sign www-ssl-leaf ca=my-ca
/ip service set www-ssl certificate=www-ssl-leaf
```

Lalu ambil isi certificate **CA**-nya (`my-ca`, bukan `www-ssl-leaf`) buat
diisi ke `MIKROTIK_CA_CERT`:

```
/certificate export-certificate my-ca export-passphrase=""
```

File hasil export muncul di menu **Files** — download (drag ke Desktop di
Winbox), buka dengan text editor, copy semua isinya (termasuk baris
`BEGIN`/`END CERTIFICATE`) ke secret `MIKROTIK_CA_CERT`.

### Catatan keamanan: bikin user API khusus di Mikrotik

Jangan pakai akun admin utama. Di Winbox/webfig Mikrotik:
`System → Users → Add` — bikin user baru dengan group yang cuma punya izin
`read`, `write`, `api`, `rest-api` pada policy (bukan `full`). Ini
membatasi kerusakan kalau kredensial ini pernah bocor dari sisi Edge
Function — user itu cuma bisa baca/ubah PPP secret, bukan seluruh
konfigurasi router.

Pastikan juga RouterOS REST API (`/ip/service` → `www-ssl` atau sesuai
setup kamu) aktif dan port-nya cuma dibuka ke IP yang perlu — jangan biarkan
kebuka bebas ke seluruh internet tanpa firewall rule.

## Cara tes cepat setelah setup

Panggil dari app: buka detail Pelanggan yang sudah punya Username Mikrotik
ke-set, login sebagai Pemilik, tekan tombol Isolir. Kalau kredensial belum
diset, kamu akan lihat pesan error yang jelas, bukan crash.
