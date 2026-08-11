# 09 — Rollout paralel 1 siklus & validasi cutover

**What to build:** Bukan fitur baru — ini periode validasi operasional. Selama satu siklus tagihan penuh (satu bulan) setelah tiket 08 selesai, app dan spreadsheet **dijalankan berdampingan**: setiap pembayaran yang masuk dicatat di kedua tempat, dan di akhir periode angka-angka dicocokkan manual sebelum spreadsheet dianggap tidak lagi jadi source of truth untuk cakupan Phase 1 (billing per-Pelanggan).

**Blocked by:** 07 — Laporan agregat keuangan (Pemilik-only); 08 — Migrasi data Pelanggan aktif + status periode berjalan

**Status:** ready-for-agent

- [ ] Selama satu siklus penuh, setiap update status bayar dicatat baik di app maupun spreadsheet
- [ ] Di akhir siklus, total omset, total Sudah Bayar, dan total Belum Bayar dari laporan app (tiket 07) dicocokkan satu-satu terhadap Summary spreadsheet
- [ ] Selisih (kalau ada) diinvestigasi dan akar masalahnya dicatat sebelum dianggap selesai — bukan diabaikan
- [ ] Setelah angka cocok, keputusan cutover (spreadsheet berhenti dipakai untuk billing per-Pelanggan Phase 1) didokumentasikan — spreadsheet tetap dipakai untuk hal-hal Phase 2 (laporan keuangan bisnis) sampai itu juga dibangun
