-- Fitur delete (Pemilik-only) untuk Wilayah, ODP, Pelanggan, Paket.
-- Delete akun (Admin/Teknisi) tidak butuh policy di sini -- itu lewat Edge
-- Function delete-account yang pakai service_role (bypass RLS).
--
-- Constraint foreign key yang sudah ada (default RESTRICT, tanpa ON DELETE
-- CASCADE) otomatis menolak delete kalau datanya masih dipakai -- itu
-- sengaja, bukan perlu ditambah apa-apa lagi di sini.
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0011.

create policy "only pemilik can delete wilayah"
  on public.wilayah for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "only pemilik can delete odp"
  on public.odp for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "only pemilik can delete pelanggan"
  on public.pelanggan for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "only pemilik can delete paket"
  on public.paket for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');
