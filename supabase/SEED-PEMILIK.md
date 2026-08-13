# Seed akun Pemilik pertama

Migration `20260101000000_init.sql` sudah membuat skema dan Wilayah default, tapi akun
Pemilik bootstrap harus dibuat lewat Supabase Dashboard karena melibatkan
Supabase Auth (bukan sekadar insert SQL biasa).

## Langkah

1. Jalankan `supabase/migrations/20260101000000_init.sql` di **SQL Editor** Supabase Dashboard (kalau belum).
2. Buka **Authentication → Users → Add user → Create new user**.
   - **Email**: `<username-pilihan-anda>@internal.kristek.app` (contoh: `pemilik@internal.kristek.app`) — sesuai pemetaan `usernameToEmail`, ini bukan email sungguhan.
   - **Password**: password yang akan dipakai untuk login Pemilik di app.
   - Centang **Auto Confirm User** supaya tidak perlu verifikasi email.
3. Setelah user dibuat, salin **UID**-nya (terlihat di daftar Users).
4. Buka **SQL Editor** lagi, jalankan (ganti `<UID>` dan data di bawah sesuai kebutuhan):

```sql
insert into public.users (id, nama, alamat, no_telp, username, role, wilayah_id)
values (
  'c78f1a85-81de-4d57-a14a-588f18d08ce7',
  'ricokrisna',
  'JL.GOBANG',
  '089699680859',
  'pemilik',
  'pemilik',
  (select id from public.wilayah limit 1)
);
```

Setelah ini, login di app dengan **username** `pemilik` (atau username yang
Anda pilih) dan password yang tadi diisi di langkah 2 — bukan dengan email.

## Lupa password Pemilik?

Karena emailnya sintetis (`...@internal.kristek.app`, bukan email
sungguhan), reset password lewat email tidak akan berfungsi. Kalau
Dashboard Anda juga tidak punya opsi "set password langsung" di halaman
detail user, cara tercepat adalah hapus lalu buat ulang user-nya:

1. **Authentication → Users**, klik menu **⋮** di baris user yang lupa
   passwordnya → **Delete user**. Baris terkait di `public.users` ikut
   terhapus otomatis (foreign key `on delete cascade`).
2. Ulangi langkah 2-4 di atas dengan password baru yang dicatat baik-baik.
   UID yang baru akan berbeda dari sebelumnya — pastikan pakai UID yang
   baru saat insert ke `public.users`.
