-- Tiket 06: skema Tiket + penugasan Teknisi + Notifikasi in-app + RLS.
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0006.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tiket_jenis') then
    create type public.tiket_jenis as enum ('instalasi', 'gangguan_komplain', 'maintenance');
  end if;
  if not exists (select 1 from pg_type where typname = 'tiket_status') then
    create type public.tiket_status as enum
      ('baru', 'ditugaskan', 'dikerjakan', 'pending', 'selesai', 'dibatalkan');
  end if;
  if not exists (select 1 from pg_type where typname = 'notifikasi_type') then
    create type public.notifikasi_type as enum ('ditugaskan', 'pending', 'selesai');
  end if;
end $$;

create table if not exists public.tiket (
  id uuid primary key default gen_random_uuid(),
  jenis public.tiket_jenis not null,
  pelanggan_id uuid not null references public.pelanggan (id),
  wilayah_id uuid not null references public.wilayah (id),
  status public.tiket_status not null default 'baru',
  created_by uuid not null references public.users (id),
  started_at timestamptz,
  ended_at timestamptz,
  accumulated_pending_seconds integer not null default 0,
  notes text,
  dibatalkan_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.tiket_teknisi (
  tiket_id uuid not null references public.tiket (id) on delete cascade,
  teknisi_id uuid not null references public.users (id),
  primary key (tiket_id, teknisi_id)
);

create table if not exists public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  tiket_id uuid not null references public.tiket (id) on delete cascade,
  type public.notifikasi_type not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tiket enable row level security;
alter table public.tiket_teknisi enable row level security;
alter table public.notifikasi enable row level security;

-- Tiket: Pemilik baca semua, Admin baca Wilayah sendiri, Teknisi baca hanya
-- Tiket yang ditugaskan ke mereka.
create policy "pemilik can read all tiket"
  on public.tiket for select
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "admin can read own wilayah tiket"
  on public.tiket for select
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );

create policy "teknisi can read assigned tiket"
  on public.tiket for select
  to authenticated
  using (
    exists (
      select 1 from public.tiket_teknisi tt
      where tt.tiket_id = tiket.id and tt.teknisi_id = auth.uid()
    )
  );

create policy "only admin can insert tiket in own wilayah"
  on public.tiket for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin'
    and wilayah_id = public.current_user_wilayah()
  );

-- tiket_teknisi: baca mengikuti apakah Tiket terkait bisa dibaca (subquery
-- ini otomatis kena RLS tiket di atas, jadi Teknisi cuma lihat baris
-- assignment miliknya sendiri, Admin lihat assignment di Wilayahnya, dst).
create policy "select tiket_teknisi if tiket is readable"
  on public.tiket_teknisi for select
  to authenticated
  using (
    exists (select 1 from public.tiket t where t.id = tiket_teknisi.tiket_id)
  );

create policy "admin can insert tiket_teknisi for own wilayah tiket"
  on public.tiket_teknisi for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.tiket t
      where t.id = tiket_teknisi.tiket_id
        and t.wilayah_id = public.current_user_wilayah()
    )
  );

-- notifikasi: tiap pengguna cuma baca & tandai-terbaca notifikasinya sendiri.
-- Insert dibiarkan terbuka untuk semua authenticated user karena beberapa
-- alur (assign oleh Admin, Pending oleh Teknisi) sama-sama perlu membuat
-- notifikasi untuk pengguna LAIN -- proteksi utamanya ada di select/update.
create policy "users can read own notifikasi"
  on public.notifikasi for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can mark own notifikasi read"
  on public.notifikasi for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "any authenticated user can insert notifikasi"
  on public.notifikasi for insert
  to authenticated
  with check (true);

-- Aktifkan Supabase Realtime untuk tabel ini supaya lonceng notifikasi bisa
-- langganan perubahan langsung (dipakai di layar Bell Notifikasi).
alter publication supabase_realtime add table public.notifikasi;
