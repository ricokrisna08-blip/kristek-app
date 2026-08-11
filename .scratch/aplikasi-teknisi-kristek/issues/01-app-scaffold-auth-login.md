# 01 — App scaffold, Supabase auth, and login (semua Role)

**What to build:** Expo (React Native) app terhubung ke Supabase, dengan layar login username/password (username dipetakan ke email sintetis di baliknya) untuk ketiga Role (Pemilik, Admin, Teknisi). Setelah login, pengguna diarahkan ke home screen kosong sesuai Role-nya. Sertakan migration/seed: satu akun Pemilik bootstrap dan satu Wilayah default (kelurahan yang sedang beroperasi saat ini), supaya tiket-tiket berikutnya punya data dasar untuk bekerja.

**Blocked by:** None — bisa mulai langsung

**Status:** ready-for-agent

- [ ] Expo app baru terhubung ke project Supabase (Auth + Postgres)
- [ ] Skema `users` (id, nama, alamat, no_telp, username, password_hash, role, wilayah_id) dan `wilayah` (id, nama) dibuat
- [ ] Seed: satu Wilayah default, satu akun Pemilik dengan username/password diketahui
- [ ] Layar login menerima username+password, memetakan ke email sintetis Supabase Auth di belakang layar
- [ ] Setelah login sukses, pengguna diarahkan ke home screen kosong yang berbeda per Role
- [ ] Login dengan kredensial salah menampilkan pesan error, tidak meloloskan pengguna
