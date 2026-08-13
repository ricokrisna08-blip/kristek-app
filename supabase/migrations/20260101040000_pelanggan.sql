-- Tiket 05: skema Pelanggan + Nomor Pelanggan auto-generate + RLS.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0004.

create sequence if not exists public.pelanggan_nomor_seq;

create table if not exists public.pelanggan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text not null,
  no_hp text not null,
  nomor_pelanggan text not null unique
    default ('PLG-' || lpad(nextval('public.pelanggan_nomor_seq')::text, 6, '0')),
  wilayah_id uuid not null references public.wilayah (id),
  odp_id uuid not null references public.odp (id),
  created_at timestamptz not null default now()
);

alter table public.pelanggan enable row level security;

-- Pola RLS sama seperti odp (0004): Pemilik baca semua, non-Pemilik baca
-- Wilayah sendiri, cuma Admin insert dan wajib di Wilayah sendiri.
create policy "pemilik can read all pelanggan"
  on public.pelanggan for select
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "non-pemilik can read own wilayah pelanggan"
  on public.pelanggan for select
  to authenticated
  using (wilayah_id = public.current_user_wilayah());

create policy "only admin can insert pelanggan in own wilayah"
  on public.pelanggan for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );
