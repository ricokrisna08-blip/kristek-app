# 07 — Laporan agregat keuangan (Pemilik-only)

**What to build:** Layar khusus Pemilik yang menampilkan, per periode: total omset (jumlah seluruh Tagihan), total Sudah Bayar, total Belum Bayar, dan persentase terbayar — dihitung dari data `tagihan` yang sudah ada. Layar ini tidak bisa diakses Admin maupun Teknisi.

**Blocked by:** 04 — Update status bayar (Sudah/Belum Bayar)

**Status:** ready-for-agent

- [ ] Layar laporan menampilkan total omset, total Sudah Bayar (Rp), total Belum Bayar (Rp), dan persentase terbayar untuk periode yang dipilih
- [ ] Pemilik bisa memilih periode (bulan) yang ingin dilihat, minimal periode-periode yang sudah pernah digenerate
- [ ] Layar ini hanya muncul/bisa diakses oleh role Pemilik — Admin dan Teknisi tidak melihat menu ini sama sekali, dan query-nya ditolak RLS kalau diakses langsung
- [ ] Angka-angka di laporan teruji benar terhadap fixture data Tagihan yang diketahui (unit test perhitungan agregat)
