# Migration workflow

Sebelumnya semua migration di folder ini dijalankan manual satu-satu lewat
Supabase Dashboard -> SQL Editor. Itu jalan, tapi nggak ada catatan pasti
migration mana yang beneran sudah diterapkan ke database production vs yang
cuma ada di repo -- gampang lupa/keliru urutan.

Sekarang project ini pakai [Supabase CLI](https://supabase.com/docs/guides/cli)
(sudah ditambahkan sebagai dev dependency di `package.json`), yang mencatat
migration mana yang sudah diterapkan lewat tabel bawaan
`supabase_migrations.schema_migrations` di database itu sendiri.

Semua 25 migration lama (`0001_init.sql` dst.) sudah di-rename ke format
timestamp yang dibutuhkan CLI (`20260101000000_init.sql` dst., urutannya
tetap sama persis seperti sebelumnya). **Isi filenya tidak diubah sama
sekali** -- cuma nama file.

## Setup sekali di awal (WAJIB kamu jalankan sendiri, butuh login akunmu)

Perintah-perintah ini tidak bisa saya jalankan lewat Claude Code karena butuh
login interaktif ke akun Supabase-mu.

```bash
npm install                # ambil dependency "supabase" yang baru ditambahkan

npx supabase login         # buka browser, login ke akun Supabase kamu

npx supabase init          # generate supabase/config.toml (aman, tidak
                            # menimpa folder migrations/ atau functions/
                            # yang sudah ada)

npx supabase link --project-ref hlqscciwzawekvwowyzv
                            # hubungkan CLI ke project kristek-app
```

Setelah `link`, CLI akan melihat 25 file migration di repo ini tapi belum
tahu bahwa semuanya **sudah** diterapkan ke database (karena selama ini
dijalankan manual, bukan lewat CLI). Supaya CLI tidak mencoba menjalankan
ulang 25 migration yang sudah live, tandai semuanya sebagai "applied" sekali
saja:

```bash
npx supabase migration repair --status applied \
  20260101000000 20260101010000 20260101020000 20260101030000 \
  20260101040000 20260101050000 20260101060000 20260101070000 \
  20260101080000 20260101090000 20260101100000 20260101110000 \
  20260101120000 20260101130000 20260101140000 20260101150000 \
  20260101160000 20260101170000 20260101180000 20260101190000 \
  20260101200000 20260101210000 20260101220000 20260101230000 \
  20260102000000
```

Cek hasilnya cocok (kolom Local dan Remote harus sama-sama centang untuk
semua 25 baris):

```bash
npm run db:list
```

## Workflow mulai sekarang, untuk migration BARU

```bash
npm run db:new nama_migration_baru   # bikin file kosong dengan timestamp
                                      # yang benar di supabase/migrations/

# ...isi file SQL-nya seperti biasa...

npm run db:push                      # terapkan migration yang belum
                                      # diterapkan ke database production
```

`db:push` cuma menjalankan migration yang belum tercatat "applied" --jadi
aman dijalankan berkali-kali, tidak akan menjalankan ulang yang sudah live.

Kalau suatu saat migration BARU malah kamu jalankan manual lagi lewat SQL
Editor (misal Claude Code kena block klik Run karena query-nya destruktif),
tandai juga migration itu sebagai applied setelahnya:

```bash
npx supabase migration repair --status applied <timestamp_migration_itu>
```
