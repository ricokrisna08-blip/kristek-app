-- billing-tagihan-kristek, tiket 01: kolom harga langganan per Pelanggan.
-- Field berdiri sendiri per Pelanggan (bukan default dari Paket) karena
-- harga riil bervariasi per orang (subsidi/nego) walau Paket-nya sama.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0020.

alter table public.pelanggan
  add column if not exists harga integer;

-- Pelanggan enable RLS sejak 0005 tapi belum pernah punya policy UPDATE.
-- Pola sama seperti insert (0005): hanya Admin, dibatasi ke Wilayah sendiri.
create policy "only admin can update pelanggan in own wilayah"
  on public.pelanggan for update
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  )
  with check (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );
