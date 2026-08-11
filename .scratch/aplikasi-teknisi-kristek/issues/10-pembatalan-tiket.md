# 10 — Pembatalan Tiket

**What to build:** Admin atau Pemilik bisa membatalkan Tiket dari status non-final manapun (Baru, Ditugaskan, Dikerjakan, atau Pending), misalnya karena salah input atau Pelanggan batal. Teknisi tidak punya akses ke aksi ini.

**Blocked by:** 06 — Buat & tugaskan Tiket + notifikasi in-app

**Status:** ready-for-agent

- [ ] Unit test state machine untuk transisi apa pun → Dibatalkan, dari setiap status non-final, ditolak dari status "Selesai" atau "Dibatalkan"
- [ ] Admin bisa membatalkan Tiket yang dia buat/kelola di Wilayah-nya
- [ ] Pemilik bisa membatalkan Tiket manapun lintas Wilayah
- [ ] Teknisi yang mencoba membatalkan Tiket ditolak
- [ ] Tiket yang sudah "Selesai" atau sudah "Dibatalkan" tidak bisa dibatalkan lagi
- [ ] dibatalkan_by tercatat pada Tiket yang dibatalkan
