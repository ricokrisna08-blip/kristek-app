# 11 — Laporan Performa Teknisi (Pemilik)

**What to build:** Layar khusus Pemilik yang menampilkan, per Teknisi: jumlah Tiket Selesai, rata-rata Durasi Kerja, dan jumlah kali status Pending — dihitung dari data Tiket/tiket_teknisi yang sudah ada.

**Blocked by:** 09 — State machine Tiket: End → Selesai

**Status:** ready-for-agent

- [ ] Pemilik bisa membuka layar Laporan Performa dan melihat daftar seluruh Teknisi
- [ ] Untuk tiap Teknisi, ditampilkan: jumlah Tiket berstatus Selesai yang dia ikut kerjakan, rata-rata Durasi Kerja dari Tiket-Tiket tersebut, dan jumlah kali Tiket yang dia kerjakan pernah masuk status Pending
- [ ] Teknisi dalam tim yang sama pada satu Tiket Selesai sama-sama terhitung (kredit merata, sesuai ADR-0002)
- [ ] Admin dan Teknisi tidak punya akses ke layar ini
- [ ] Laporan mencakup Teknisi lintas semua Wilayah (visibilitas Pemilik)
