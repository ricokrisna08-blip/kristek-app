# 03 — Trigger "Generate Tagihan" dari UI + daftar Tagihan periode berjalan

**What to build:** Layar billing baru di app: tombol "Generate Tagihan" (memanggil fungsi dari tiket 02 untuk periode berjalan), dan daftar Tagihan periode berjalan menampilkan Nama Pelanggan, jumlah, dan status_bayar. Tombol dan daftar ini bisa diakses Admin maupun Pemilik. Daftar **tidak** difilter per Wilayah — Admin melihat Tagihan lintas semua Wilayah (lihat `docs/adr/0003-billing-access-centralized-not-wilayah-scoped.md` untuk alasannya).

**Blocked by:** 02 — Skema Tagihan + fungsi generate (idempotent)

**Status:** ready-for-agent

- [ ] Admin dan Pemilik melihat menu/layar billing baru; Teknisi tidak melihat menu ini sama sekali
- [ ] Tombol "Generate Tagihan" memicu fungsi generate untuk periode berjalan
- [ ] Menekan tombol saat periode berjalan sudah pernah digenerate tidak error dan tidak membuat duplikat (memanfaatkan idempotency dari tiket 02) — beri feedback jelas ke user (mis. "Tagihan bulan ini sudah pernah dibuat")
- [ ] Daftar Tagihan periode berjalan menampilkan Nama Pelanggan, jumlah, dan status_bayar
- [ ] Daftar menampilkan Tagihan dari semua Wilayah untuk Admin (bukan cuma Wilayah Admin tersebut) — sesuai ADR-0003
- [ ] Pemilik melihat daftar yang sama seperti Admin (tidak difilter Wilayah, karena Pemilik memang sudah unscoped di seluruh app)
