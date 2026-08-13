-- billing-tagihan-kristek, susulan: checkbox "Sudah Bayar Bulan Ini" +
-- auto-isolir Mikrotik. Ini simplifikasi sengaja -- BUKAN tabel `tagihan`
-- penuh (periode, histori) dari spec billing Phase 1, cuma satu flag per
-- Pelanggan yang direset tiap awal bulan. Kalau nanti tabel `tagihan`
-- beneran dibangun (issue 02-04), pertimbangkan reconcile dua mekanisme
-- ini supaya nggak ada dua sumber kebenaran soal status bayar.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0021.

alter table public.pelanggan
  add column if not exists mikrotik_username text,
  add column if not exists sudah_bayar_bulan_ini boolean not null default false,
  add column if not exists is_isolir boolean not null default false,
  add column if not exists isolir_at timestamptz;

-- Pemilik belum pernah punya policy UPDATE di pelanggan sama sekali (0021
-- cuma nambah policy buat Admin, dibatasi Wilayah sendiri). Pemilik butuh
-- update lintas-Wilayah buat set mikrotik_username dan override isolir
-- manual -- konsisten dengan visibilitas Pemilik yang unscoped di seluruh
-- app.
create policy "pemilik can update any pelanggan"
  on public.pelanggan for update
  to authenticated
  using (public.current_user_role() = 'pemilik')
  with check (public.current_user_role() = 'pemilik');
