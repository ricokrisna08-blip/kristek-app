-- ODP belum pernah punya UPDATE policy sama sekali (cuma select/insert/delete
-- sejak 0004/0012/0019) -- ditambah sekarang buat fitur Edit ODP di
-- OdpManagementScreen. Tanpa ini, update dari app akan no-op diam-diam
-- (RLS block tanpa error) alih-alih benar-benar gagal kelihatan.

-- Admin cuma boleh edit ODP di Wilayah sendiri, dan tidak boleh
-- "memindahkan" ODP itu ke Wilayah lain lewat edit.
create policy "admin can update own wilayah odp"
  on public.odp for update
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  )
  with check (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );

-- Pemilik boleh edit ODP manapun, termasuk pindah Wilayah, konsisten dengan
-- insert Pemilik yang sudah lintas Wilayah sejak 0019.
create policy "pemilik can update any wilayah odp"
  on public.odp for update
  to authenticated
  using (public.current_user_role() = 'pemilik')
  with check (public.current_user_role() = 'pemilik');
