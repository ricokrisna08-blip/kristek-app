# 06 — Buat & tugaskan Tiket + notifikasi in-app

**What to build:** Admin membuat Tiket baru untuk seorang Pelanggan (Jenis: Instalasi/Gangguan-Komplain/Maintenance) dan menugaskan satu atau lebih Teknisi. Tiket masuk status "Ditugaskan", dan setiap Teknisi yang ditugaskan menerima notifikasi. Tiket ini juga membangun infrastruktur notifikasi in-app secara penuh (tabel `notifikasi`, langganan realtime, UI lonceng) yang akan dipakai ulang oleh tiket-tiket berikutnya (Pending, Selesai).

**Blocked by:** 03 — Manajemen akun (Pemilik buat Admin/Teknisi); 05 — Manajemen Pelanggan

**Status:** ready-for-agent

- [ ] Skema `tiket` (id, jenis, pelanggan_id, wilayah_id, status, created_by, started_at, ended_at, accumulated_pending_seconds, notes, dibatalkan_by) dan `tiket_teknisi` (join table tiket_id, teknisi_id) dibuat
- [ ] Skema `notifikasi` (id, user_id, tiket_id, type, read_at, created_at) dibuat
- [ ] Admin bisa membuat Tiket baru untuk Pelanggan yang sudah ada, memilih Jenis, dan menugaskan satu atau lebih Teknisi (dipilih by ID/nama)
- [ ] Setelah dibuat dan ditugaskan, status Tiket otomatis "Ditugaskan"
- [ ] Setiap Teknisi yang ditugaskan menerima baris baru di `notifikasi` (type: ditugaskan)
- [ ] UI lonceng notifikasi (dipakai bersama oleh semua Role) menampilkan daftar notifikasi pengguna yang login secara realtime, dan bisa ditandai terbaca
- [ ] Teknisi yang login melihat Tiket yang ditugaskan kepadanya di daftar Tiket miliknya
