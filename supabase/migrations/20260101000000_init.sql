-- Tiket 01: skema dasar Wilayah + Users (profil), sesuai CONTEXT.md dan spec.md
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.wilayah (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('pemilik', 'admin', 'teknisi');
  end if;
end $$;

-- Profil pengguna, satu baris per akun auth.users. Password TIDAK disimpan di
-- sini — itu dikelola Supabase Auth sendiri di tabel internal auth.users.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  alamat text not null,
  no_telp text not null,
  username text not null unique,
  role public.user_role not null,
  wilayah_id uuid references public.wilayah (id),
  created_at timestamptz not null default now()
);

alter table public.wilayah enable row level security;
alter table public.users enable row level security;

-- Semua pengguna yang sudah login boleh membaca daftar Wilayah (dibutuhkan
-- untuk dropdown pemilihan Wilayah di berbagai layar).
create policy "wilayah readable by authenticated users"
  on public.wilayah for select
  to authenticated
  using (true);

-- Setiap pengguna hanya boleh membaca profilnya sendiri untuk saat ini.
-- Kebijakan yang lebih luas (Pemilik melihat semua, dsb.) menyusul di
-- tiket manajemen akun/Wilayah.
create policy "users can read own profile"
  on public.users for select
  to authenticated
  using (id = auth.uid());

-- Seed: satu Wilayah default (kelurahan yang sedang beroperasi saat ini).
insert into public.wilayah (nama)
select 'Wilayah Awal'
where not exists (select 1 from public.wilayah);
