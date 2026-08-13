-- Fitur tambahan: Paket internet (15/30/50 Mbps dst.) + kaitkan ke Pelanggan.
-- Beda dari odp/wilayah: Paket adalah satu katalog yang sama untuk semua
-- Wilayah (bukan scoped per-Wilayah) — produk bisnis, bukan lokasi fisik.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0005.

create table if not exists public.paket (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

alter table public.paket enable row level security;

-- Semua pengguna yang sudah login boleh membaca daftar Paket (dibutuhkan
-- Admin untuk dropdown saat membuat Pelanggan).
create policy "paket readable by authenticated users"
  on public.paket for select
  to authenticated
  using (true);

-- Hanya Pemilik yang boleh menambah Paket baru (katalog lintas-Wilayah,
-- sama seperti Wilayah dan akun pengguna).
create policy "only pemilik can insert paket"
  on public.paket for insert
  to authenticated
  with check (public.current_user_role() = 'pemilik');

-- Kaitkan Pelanggan ke Paket. Nullable karena tabel pelanggan sudah ada
-- baris sebelum kolom ini ditambahkan.
alter table public.pelanggan
  add column if not exists paket_id uuid references public.paket (id);
