# 04 — Update status bayar (Sudah/Belum Bayar)

**What to build:** Dari daftar Tagihan (tiket 03), Admin bisa menandai satu baris Tagihan sebagai "Sudah Bayar" (mengisi `dibayar_at`) atau mengembalikannya ke "Belum Bayar". Status ini binary — tidak ada pembayaran sebagian/cicilan.

**Blocked by:** 03 — Trigger "Generate Tagihan" dari UI + daftar Tagihan periode berjalan

**Status:** ready-for-agent

- [ ] Admin bisa mengubah `status_bayar` satu baris Tagihan dari "Belum Bayar" ke "Sudah Bayar" (dan sebaliknya) langsung dari daftar atau layar detail Tagihan
- [ ] Menandai "Sudah Bayar" mengisi `dibayar_at` dengan waktu saat itu; mengembalikan ke "Belum Bayar" mengosongkan `dibayar_at`
- [ ] Perubahan status langsung terlihat di daftar Tagihan (tiket 03) tanpa perlu reload manual
- [ ] Pemilik juga bisa melakukan aksi yang sama (akses Pemilik superset dari Admin di modul ini)
- [ ] Teknisi tidak punya akses ke aksi ini di level manapun (UI maupun RLS)
