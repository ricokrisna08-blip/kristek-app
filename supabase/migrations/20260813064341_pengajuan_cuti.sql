-- Feedback: form pengajuan izin/cuti dari Teknisi. Teknisi submit, Admin
-- dan Pemilik dapet notifikasi -- sengaja TANPA alur approve/tolak (cukup
-- submit + catatan/log), sesuai keputusan waktu diskusi fitur ini.

create table if not exists public.pengajuan_cuti (
  id uuid primary key default gen_random_uuid(),
  teknisi_id uuid not null references public.users (id),
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  alasan text not null,
  created_at timestamptz not null default now()
);

alter table public.pengajuan_cuti enable row level security;

create policy "teknisi can insert own pengajuan cuti"
  on public.pengajuan_cuti for insert
  to authenticated
  with check (
    public.current_user_role() = 'teknisi'
    and teknisi_id = auth.uid()
  );

create policy "teknisi can read own pengajuan cuti"
  on public.pengajuan_cuti for select
  to authenticated
  using (teknisi_id = auth.uid());

create policy "admin and pemilik can read all pengajuan cuti"
  on public.pengajuan_cuti for select
  to authenticated
  using (public.current_user_role() in ('admin', 'pemilik'));

-- Perluas notifikasi (0006) supaya bisa dipakai juga untuk pengajuan cuti,
-- bukan cuma Tiket. tiket_id jadi nullable, cuti_id baru ditambah, dan
-- constraint memastikan tiap notifikasi tetap merujuk salah satu dari
-- keduanya (tidak keduanya kosong).
alter table public.notifikasi
  alter column tiket_id drop not null;

alter table public.notifikasi
  add column if not exists cuti_id uuid references public.pengajuan_cuti (id) on delete cascade;

alter table public.notifikasi
  add constraint notifikasi_tiket_or_cuti_check
  check (tiket_id is not null or cuti_id is not null);

alter type public.notifikasi_type add value if not exists 'cuti_diajukan';
