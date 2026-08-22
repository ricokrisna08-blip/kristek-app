-- Izinkan Admin mengganti Teknisi yang ditugaskan ke Tiket, selama Tiket
-- masih berstatus "ditugaskan" (belum di-Start Teknisi-nya). Sebelum ini,
-- tiket_teknisi cuma punya RLS SELECT + INSERT -- tidak ada cara untuk
-- ganti assignment sama sekali dari app.

-- Perketat policy INSERT yang sudah ada: tambah syarat status Tiket masih
-- "ditugaskan". Aman untuk alur create (Tiket baru selalu lahir dengan
-- status itu), sekaligus jadi pengaman DB-level untuk alur ganti Teknisi
-- (bukan cuma dicek di client).
drop policy if exists "admin can insert tiket_teknisi for own wilayah tiket" on public.tiket_teknisi;
create policy "admin can insert tiket_teknisi for own wilayah tiket while ditugaskan"
  on public.tiket_teknisi for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.tiket t
      where t.id = tiket_teknisi.tiket_id
        and t.wilayah_id = public.current_user_wilayah()
        and t.status = 'ditugaskan'
    )
  );

-- Baru: DELETE belum pernah ada sama sekali di tabel ini -- dibutuhkan
-- untuk melepas assignment lama sebelum insert assignment baru (ganti
-- Teknisi = delete semua baris lama + insert baris baru).
create policy "admin can delete tiket_teknisi for own wilayah tiket while ditugaskan"
  on public.tiket_teknisi for delete
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.tiket t
      where t.id = tiket_teknisi.tiket_id
        and t.wilayah_id = public.current_user_wilayah()
        and t.status = 'ditugaskan'
    )
  );
