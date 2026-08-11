-- Tiket 07: skema tiket_foto + Storage bucket publik untuk Bukti Foto.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0012.

create table if not exists public.tiket_foto (
  id uuid primary key default gen_random_uuid(),
  tiket_id uuid not null references public.tiket (id) on delete cascade,
  type text not null check (type in ('before', 'after')),
  url text not null,
  uploaded_by uuid not null references public.users (id),
  uploaded_at timestamptz not null default now()
);

alter table public.tiket_foto enable row level security;

-- Cuma Teknisi yang ditugaskan ke Tiket itu yang boleh upload bukti foto.
create policy "teknisi can insert tiket_foto for assigned tiket"
  on public.tiket_foto for insert
  to authenticated
  with check (public.is_teknisi_assigned_to_tiket(tiket_id));

-- Baca mengikuti apakah Tiket terkait bisa dibaca (pola sama seperti
-- tiket_teknisi di 0007): Pemilik semua, Admin Wilayah sendiri, Teknisi
-- yang ditugaskan.
create policy "select tiket_foto if tiket is readable"
  on public.tiket_foto for select
  to authenticated
  using (
    exists (select 1 from public.tiket t where t.id = tiket_foto.tiket_id)
  );

-- Storage bucket publik untuk Bukti Foto (lihat keputusan di percakapan:
-- aplikasi internal, foto bukan data sangat rahasia, URL-nya random/tidak
-- ditebak, dan yang bisa lihat lewat app toh sudah lolos RLS tiket_foto).
insert into storage.buckets (id, name, public)
values ('tiket-foto', 'tiket-foto', true)
on conflict (id) do nothing;

create policy "authenticated users can upload tiket foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'tiket-foto');
