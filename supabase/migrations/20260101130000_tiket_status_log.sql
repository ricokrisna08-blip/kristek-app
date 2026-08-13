-- Riwayat/log perubahan status Tiket dengan timestamp, ditampilkan sebagai
-- timeline di detail Tiket.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0013.

create table if not exists public.tiket_status_log (
  id uuid primary key default gen_random_uuid(),
  tiket_id uuid not null references public.tiket (id) on delete cascade,
  status public.tiket_status not null,
  changed_by uuid not null references public.users (id),
  changed_at timestamptz not null default now(),
  notes text
);

alter table public.tiket_status_log enable row level security;

-- Baca mengikuti apakah Tiket terkait bisa dibaca (pola sama seperti
-- tiket_foto/tiket_teknisi).
create policy "select tiket_status_log if tiket is readable"
  on public.tiket_status_log for select
  to authenticated
  using (
    exists (select 1 from public.tiket t where t.id = tiket_status_log.tiket_id)
  );

-- Insert dibiarkan terbuka untuk authenticated user (sama seperti
-- notifikasi) -- proteksi sebenarnya ada di alur aplikasi yang memicu tiap
-- perubahan status (Admin buat Tiket, Teknisi Start/Pending/Lanjut/End).
create policy "any authenticated user can insert tiket_status_log"
  on public.tiket_status_log for insert
  to authenticated
  with check (true);
