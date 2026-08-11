# 08 — State machine Tiket: Pending & Lanjut

**What to build:** Perluasan Tiket State Machine dari tiket 07: Teknisi bisa menandai Tiket "Pending" (catatan wajib) saat terkendala di lapangan, memicu notifikasi ke Admin yang menugaskan dan ke Pemilik (memakai infrastruktur notifikasi dari tiket 06). Teknisi menekan tombol "Lanjut" untuk resume, jam kerja lanjut berjalan tanpa menghitung waktu selama Pending.

**Blocked by:** 07 — State machine Tiket: Start → Dikerjakan

**Status:** ready-for-agent

- [ ] Unit test untuk transisi Dikerjakan → Pending: berhasil dengan catatan, ditolak tanpa catatan
- [ ] Unit test untuk transisi Pending → Dikerjakan (Lanjut): akumulasi waktu Pending dikecualikan dari total durasi kerja
- [ ] Teknisi bisa menekan "Pending" pada Tiket berstatus "Dikerjakan", wajib mengisi catatan (notes)
- [ ] Saat Tiket masuk Pending, Admin yang menugaskan dan Pemilik menerima notifikasi baru (type: pending)
- [ ] Teknisi bisa menekan "Lanjut" pada Tiket berstatus "Pending" untuk kembali ke "Dikerjakan"
- [ ] Waktu yang dihabiskan selama status Pending tidak dihitung ke dalam Durasi Kerja
