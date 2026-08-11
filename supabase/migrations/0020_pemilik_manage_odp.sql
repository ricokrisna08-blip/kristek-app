-- Pemilik ("super power") sekarang juga bisa menambah ODP, tidak cuma
-- Admin -- beda dari Admin yang dibatasi Wilayah sendiri, Pemilik boleh
-- menambah ODP di Wilayah manapun (lintas Wilayah), sesuai visibilitasnya
-- yang memang lintas Wilayah di seluruh app.
-- Hapus ODP oleh Pemilik sudah punya policy sejak 0012, tidak perlu diubah.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0019.

create policy "pemilik can insert odp in any wilayah"
  on public.odp for insert
  to authenticated
  with check (public.current_user_role() = 'pemilik');
