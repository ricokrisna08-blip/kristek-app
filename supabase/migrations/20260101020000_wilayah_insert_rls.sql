-- Tiket 02: hanya Pemilik yang boleh menambah Wilayah baru.
-- Baca (select) tetap terbuka untuk semua authenticated user, sudah diatur
-- di 0001_init.sql (dibutuhkan Admin/Teknisi untuk dropdown Wilayah).
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001_init.sql dan 0002_users_rls_pemilik.sql.

create policy "only pemilik can insert wilayah"
  on public.wilayah for insert
  to authenticated
  with check (public.current_user_role() = 'pemilik');
