-- Admin & Pemilik bisa menghapus pengajuan cuti/izin (mis. salah input,
-- atau catatan lama yang mau dibersihkan). Notifikasi terkait ikut hilang
-- otomatis lewat "on delete cascade" pada notifikasi.cuti_id (0007).
create policy "admin and pemilik can delete pengajuan cuti"
  on public.pengajuan_cuti for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'pemilik'));
