# 02 — Skema Tagihan + fungsi generate (idempotent)

**What to build:** Tabel `tagihan` (id, pelanggan_id, periode, jumlah, status_bayar, dibayar_at, generated_at, generated_by) dengan unique constraint pada `(pelanggan_id, periode)`. Fungsi generate (Supabase Edge Function, TypeScript) yang menerima satu `periode` (mis. `2026-09`), dan untuk tiap Pelanggan aktif yang punya `harga` terisi (dari tiket 01), menyisipkan satu baris `tagihan` dengan `jumlah` = snapshot `pelanggan.harga` saat itu — Pelanggan yang sudah punya baris `tagihan` untuk `periode` yang sama dilewati, tidak dibuat ulang. Ini murni fungsi backend — belum ada UI untuk memicunya (lihat tiket 03).

**Blocked by:** 01 — Harga langganan per Pelanggan (Admin)

**Status:** ready-for-agent

- [ ] Migration: tabel `tagihan` dibuat sesuai skema di atas, dengan unique constraint `(pelanggan_id, periode)`
- [ ] Edge Function generate-tagihan: input `periode`, membuat satu baris `tagihan` per Pelanggan aktif berharga terisi
- [ ] `jumlah` pada baris `tagihan` adalah snapshot `pelanggan.harga` saat digenerate — mengedit `harga` Pelanggan setelahnya tidak mengubah `tagihan` yang sudah dibuat
- [ ] Memanggil fungsi generate dua kali untuk `periode` yang sama tidak membuat baris duplikat untuk Pelanggan manapun (idempotency — constraint atau upsert-skip, bukan try/catch di level aplikasi saja)
- [ ] Pelanggan tanpa `harga` terisi dilewati saat generate (tidak membuat `tagihan` dengan `jumlah` kosong/0)
- [ ] Unit/integration test: generate 2x periode sama → jumlah baris `tagihan` tidak berubah dari hasil generate pertama
- [ ] RLS: `tagihan` hanya bisa diakses (baca/tulis) oleh role Admin dan Pemilik — Teknisi ditolak di level policy, bukan cuma disembunyikan di UI
