# 03 — Manajemen akun (Pemilik buat Admin/Teknisi)

**What to build:** Layar khusus Pemilik untuk membuat akun Admin atau Teknisi baru (Nama, Alamat, No. Telp, Username, Password, Wilayah) dan melihat daftar akun yang ada. Akun yang dibuat di sini harus langsung bisa login lewat alur di tiket 01.

**Blocked by:** 01 — App scaffold, Supabase auth, dan login

**Status:** ready-for-agent

- [ ] Pemilik bisa membuat akun baru dengan Role Admin atau Teknisi, mengisi Nama, Alamat, No. Telp, Username, Password, dan memilih Wilayah dari data yang sudah ada
- [ ] Pemilik bisa melihat daftar seluruh akun (Admin + Teknisi) beserta Wilayah masing-masing
- [ ] Admin yang mencoba membuat akun baru ditolak (aksi ini eksklusif milik Pemilik)
- [ ] Akun Admin/Teknisi yang baru dibuat bisa langsung login dengan username/password yang diisi
- [ ] Username harus unik — mencoba membuat akun dengan username yang sudah dipakai menampilkan error
