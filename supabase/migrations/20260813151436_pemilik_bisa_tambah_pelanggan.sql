-- Pemilik sekarang juga bisa menambah Pelanggan, tidak cuma Admin -- pola
-- sama seperti Pemilik menambah ODP (0019): beda dari Admin yang dibatasi
-- Wilayah sendiri, Pemilik boleh menambah Pelanggan di Wilayah manapun
-- (lintas Wilayah, sesuai visibilitasnya yang memang lintas Wilayah).
create policy "pemilik can insert pelanggan in any wilayah"
  on public.pelanggan for insert
  to authenticated
  with check (public.current_user_role() = 'pemilik');
