-- Tiket foto: retensi 7 hari (foto lebih tua otomatis disembunyikan dari
-- app lewat listTiketFoto, dan dibersihkan permanen oleh Edge Function
-- cleanup-expired-tiket-foto) + Pemilik bisa hapus foto manual kapan saja.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0017.

-- path Storage object (mis. "tiket-1/before-169....jpg") -- dibutuhkan
-- supaya delete (manual oleh Pemilik atau otomatis oleh cleanup function)
-- bisa benar-benar menghapus file-nya, bukan cuma baris DB-nya. Foto lama
-- (kalau ada, dari sebelum kolom ini ada) tidak akan punya path -- delete
-- untuk baris itu perlu dibersihkan manual lewat Storage dashboard.
alter table public.tiket_foto
  add column if not exists path text;

-- Hanya Pemilik yang boleh hapus baris tiket_foto secara manual dari app.
create policy "pemilik can delete tiket_foto"
  on public.tiket_foto for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');

-- Hanya Pemilik yang boleh hapus file foto dari Storage lewat app.
create policy "pemilik can delete tiket foto storage objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tiket-foto'
    and public.current_user_role() = 'pemilik'
  );
