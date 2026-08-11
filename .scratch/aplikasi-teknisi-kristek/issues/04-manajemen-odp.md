# 04 — Manajemen ODP (Admin)

**What to build:** Layar untuk Admin membuat dan melihat daftar ODP (titik distribusi fiber) — Label unik, Lokasi/alamat singkat — dalam Wilayah mereka sendiri. Ini menyiapkan data yang dibutuhkan tiket 05 (Manajemen Pelanggan) untuk mengaitkan Pelanggan ke ODP asalnya.

**Blocked by:** 01 — App scaffold, Supabase auth, dan login

**Status:** ready-for-agent

- [ ] Skema `odp` (id, label unik, lokasi, wilayah_id) dibuat
- [ ] Admin bisa membuat ODP baru (Label, Lokasi) yang otomatis terikat ke Wilayah Admin yang login
- [ ] Admin bisa melihat daftar ODP, hanya yang berada di Wilayah-nya sendiri
- [ ] Pemilik bisa melihat ODP lintas semua Wilayah (konsisten dengan visibilitas lintas-Wilayah Pemilik)
- [ ] Label ODP harus unik — mencoba membuat ODP dengan Label yang sudah dipakai menampilkan error
- [ ] Teknisi tidak punya akses untuk membuat ODP baru
