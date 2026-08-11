# 07 — State machine Tiket: Start → Dikerjakan

**What to build:** Modul Tiket State Machine — pure function, tanpa I/O, framework-agnostic — yang jadi seam inti untuk seluruh logika status Tiket (lihat `spec.md` bagian Implementation Decisions). Tiket ini membangun transisi pertamanya: Teknisi menekan tombol Start pada Tiket yang ditugaskan kepadanya, wajib mengunggah foto "before" terlebih dulu, dan Tiket berpindah ke status "Dikerjakan" dengan jam kerja mulai berjalan.

**Blocked by:** 06 — Buat & tugaskan Tiket + notifikasi in-app

**Status:** ready-for-agent

- [ ] Modul Tiket State Machine dibuat: menerima state Tiket saat ini + event, mengembalikan state baru atau error validasi — tanpa akses DB/network langsung
- [ ] Unit test murni untuk transisi Ditugaskan → Dikerjakan: berhasil dengan foto "before", ditolak tanpa foto "before"
- [ ] Skema `tiket_foto` (id, tiket_id, type, url, uploaded_by, uploaded_at) dibuat, foto disimpan di Supabase Storage
- [ ] Teknisi yang ditugaskan (siapa pun anggota tim) bisa menekan Start pada Tiket berstatus "Ditugaskan"
- [ ] Menekan Start tanpa mengunggah foto "before" ditolak dengan pesan yang jelas
- [ ] Setelah Start berhasil, status Tiket menjadi "Dikerjakan" dan waktu mulai (started_at) tercatat
- [ ] Teknisi yang tidak ditugaskan ke Tiket tersebut tidak bisa menekan Start
