-- Tiket 03: Pemilik bisa membuat & melihat semua akun; role lain tidak boleh.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001_init.sql.

-- Helper security-definer: mengecek role pengguna yang sedang login tanpa
-- memicu rekursi RLS (query di dalam fungsi ini bypass RLS tabel users).
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- Tambahan atas policy "users can read own profile" dari 0001: Pemilik boleh
-- membaca seluruh baris (policy SELECT yang beda digabung dengan OR).
create policy "pemilik can read all users"
  on public.users for select
  to authenticated
  using (public.current_user_role() = 'pemilik');

-- Hanya Pemilik yang boleh membuat baris users baru (Admin/Teknisi ditolak).
create policy "only pemilik can insert users"
  on public.users for insert
  to authenticated
  with check (public.current_user_role() = 'pemilik');
