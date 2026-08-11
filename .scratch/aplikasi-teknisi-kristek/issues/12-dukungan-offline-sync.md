# 12 — Dukungan offline: antrian & sync

**What to build:** Teknisi bisa melakukan aksi Start/Pending/Lanjut/End (termasuk ambil & lampirkan foto) saat perangkatnya offline di lokasi kerja. Aksi-aksi ini diantrekan secara lokal di perangkat dan otomatis disinkronkan ke Supabase begitu koneksi kembali tersedia, memakai ulang Tiket State Machine dari tiket 07-09 untuk memvalidasi tiap aksi saat di-replay.

**Blocked by:** 09 — State machine Tiket: End → Selesai

**Status:** ready-for-agent

- [ ] Aksi Start/Pending/Lanjut/End beserta foto yang dilampirkan bisa dilakukan saat perangkat offline, tersimpan di antrian lokal
- [ ] Saat koneksi kembali tersedia, antrian otomatis diproses berurutan dan disinkronkan ke Supabase tanpa aksi manual dari Teknisi
- [ ] Setiap aksi dari antrian divalidasi ulang lewat Tiket State Machine yang sama saat di-replay (state tidak valid ditolak dan dilaporkan ke Teknisi, bukan disilent-fail)
- [ ] Foto yang diambil offline ikut ter-upload saat sync, terhubung ke Tiket dan type (before/after) yang benar
- [ ] Resolusi konflik multi-device (dua perangkat mengedit Tiket yang sama saat sama-sama offline) TIDAK ditangani di tiket ini — dicatat sebagai keterbatasan yang diketahui, sesuai bagian Out of Scope di `spec.md`
