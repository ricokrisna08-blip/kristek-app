-- Tiket 04: skema ODP + RLS.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001, 0002, dan 0003.

create table if not exists public.odp (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  lokasi text not null,
  wilayah_id uuid not null references public.wilayah (id),
  created_at timestamptz not null default now()
);

alter table public.odp enable row level security;

-- Helper security-definer: Wilayah pengguna yang sedang login. Dipakai lagi
-- di tiket 05 (Pelanggan) untuk scoping yang sama.
create or replace function public.current_user_wilayah()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select wilayah_id from public.users where id = auth.uid();
$$;

-- Pemilik baca semua ODP lintas Wilayah.
create policy "pemilik can read all odp"
  on public.odp for select
  to authenticated
  using (public.current_user_role() = 'pemilik');

-- Admin dan Teknisi baca ODP di Wilayah mereka sendiri saja. (Teknisi belum
-- punya UI untuk ini di tiket 04, tapi RLS-nya disiapkan sekarang supaya
-- tiket 06 nanti tidak perlu migration tambahan.)
create policy "non-pemilik can read own wilayah odp"
  on public.odp for select
  to authenticated
  using (wilayah_id = public.current_user_wilayah());

-- Hanya Admin yang boleh membuat ODP, dan hanya untuk Wilayah mereka sendiri
-- (mencegah Admin "menitip" ODP ke Wilayah lain).
create policy "only admin can insert odp in own wilayah"
  on public.odp for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );
