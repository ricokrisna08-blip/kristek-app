# 01 — Harga langganan per Pelanggan (Admin)

**What to build:** Tambahkan field `harga` (nullable, integer) ke skema `pelanggan`. Admin bisa mengisi/mengedit harga langganan seorang Pelanggan dari layar detail Pelanggan yang sudah ada. Field ini berdiri sendiri per Pelanggan — **tidak** mengambil default dari Paket (`paket` tetap cuma menyimpan nama/kecepatan, tidak disentuh sama sekali), karena harga riil bervariasi per orang (subsidi/nego) walau Paket-nya sama.

**Blocked by:** None — bisa mulai langsung (mengasumsikan skema `pelanggan` dari `aplikasi-teknisi-kristek` sudah ada)

**Status:** ready-for-agent

- [ ] Migration: kolom `harga` (integer, nullable) ditambahkan ke tabel `pelanggan`
- [ ] Admin bisa mengisi/mengedit `harga` dari layar detail Pelanggan
- [ ] Tidak ada perubahan apa pun pada tabel/skema `paket`
- [ ] Pelanggan tanpa `harga` terisi tetap bisa dibuka/dilihat normal (harga kosong ditampilkan jelas, misal "Belum diisi", bukan error atau 0)
- [ ] Field `harga` tidak tampil/ke-expose ke Teknisi di layar manapun
