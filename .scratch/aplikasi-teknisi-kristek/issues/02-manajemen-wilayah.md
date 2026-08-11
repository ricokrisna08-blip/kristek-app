# 02 — Manajemen Wilayah (Pemilik)

**What to build:** Layar khusus Pemilik untuk melihat daftar Wilayah yang ada (dimulai dari satu Wilayah default hasil seed tiket 01) dan menambah Wilayah baru. Ini yang menyiapkan aplikasi untuk rencana ekspansi Kristek ke lebih dari satu kelurahan (lihat `docs/adr/0001-model-wilayah-from-the-start.md`).

**Blocked by:** 01 — App scaffold, Supabase auth, dan login

**Status:** ready-for-agent

- [ ] Pemilik yang login bisa melihat daftar seluruh Wilayah
- [ ] Pemilik bisa menambah Wilayah baru (nama)
- [ ] Admin atau Teknisi yang mencoba mengakses layar ini ditolak (bukan Pemilik)
- [ ] Wilayah baru yang ditambahkan langsung muncul di dropdown pemilihan Wilayah di tempat lain (verifikasi lewat query, UI pemilihan Wilayah belum tentu ada di tiket lain)
