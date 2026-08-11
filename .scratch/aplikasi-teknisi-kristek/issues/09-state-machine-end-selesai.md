# 09 — State machine Tiket: End → Selesai

**What to build:** Perluasan terakhir Tiket State Machine: Teknisi menekan tombol End dari status "Dikerjakan" (baik lewat Pending atau tidak), wajib mengunggah foto "after" terlebih dulu, Tiket berpindah ke status "Selesai", dan Admin+Pemilik menerima notifikasi. Semua Teknisi yang ditugaskan di Tiket ini otomatis mendapat kredit performa yang sama (lihat `docs/adr/0002-shared-start-end-timer-for-team-assignments.md`).

**Blocked by:** 08 — State machine Tiket: Pending & Lanjut

**Status:** ready-for-agent

- [ ] Unit test untuk transisi Dikerjakan → Selesai: berhasil dengan foto "after", ditolak tanpa foto "after"
- [ ] Teknisi (siapa pun anggota tim yang ditugaskan) bisa menekan End pada Tiket berstatus "Dikerjakan"
- [ ] Menekan End tanpa mengunggah foto "after" ditolak dengan pesan yang jelas
- [ ] Setelah End berhasil, status Tiket menjadi "Selesai", ended_at tercatat, dan Durasi Kerja final terhitung
- [ ] Admin yang menugaskan dan Pemilik menerima notifikasi baru (type: selesai)
- [ ] Query performa (dipakai tiket 11) bisa mengaitkan Tiket Selesai ini secara merata ke semua Teknisi yang ada di `tiket_teknisi`, tanpa perlu baris "kredit" terpisah
