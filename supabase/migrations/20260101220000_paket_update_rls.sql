-- Paket enable RLS sejak 0006 (insert+select) dan 0012 (delete), tapi
-- belum pernah punya policy UPDATE -- perlu buat fitur edit nama Paket.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0022.

create policy "only pemilik can update paket"
  on public.paket for update
  to authenticated
  using (public.current_user_role() = 'pemilik')
  with check (public.current_user_role() = 'pemilik');
