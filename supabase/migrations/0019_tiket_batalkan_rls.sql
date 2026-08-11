-- Tiket 10: Admin/Pemilik bisa membatalkan Tiket. dibatalkan_by sudah ada
-- sejak 0007 -- yang kurang cuma izin UPDATE-nya (pola sama seperti 0016
-- untuk Teknisi).
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0018.

-- Fix: policy UPDATE Teknisi dari 0016 tidak membatasi nilai status yang
-- boleh di-set -- artinya Teknisi sebenarnya BISA membatalkan Tiket kalau
-- tahu cara panggil fungsi yang sama, padahal cuma UI-nya yang
-- menyembunyikan tombol itu dari mereka. Tiket ini eksplisit mensyaratkan
-- Teknisi ditolak, jadi policy-nya diperketat: Teknisi tidak pernah boleh
-- set status jadi 'dibatalkan'.
drop policy if exists "teknisi can update assigned tiket status" on public.tiket;

create policy "teknisi can update assigned tiket status"
  on public.tiket for update
  to authenticated
  using (public.is_teknisi_assigned_to_tiket(id))
  with check (
    public.is_teknisi_assigned_to_tiket(id)
    and status <> 'dibatalkan'
  );

create policy "admin can update own wilayah tiket"
  on public.tiket for update
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  )
  with check (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );

create policy "pemilik can update any tiket"
  on public.tiket for update
  to authenticated
  using (public.current_user_role() = 'pemilik')
  with check (public.current_user_role() = 'pemilik');
