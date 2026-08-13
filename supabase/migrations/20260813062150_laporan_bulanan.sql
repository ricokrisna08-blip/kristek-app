-- billing-tagihan-kristek, Phase 2 (parsial): Laporan Keuangan bulanan
-- untuk Pemilik.
--
-- Tabel ini nyimpen SNAPSHOT histori per bulan (Total User, Omset, Sudah
-- Bayar, Belum Bayar). Bulan yang sedang berjalan TIDAK disimpan di sini --
-- dihitung live dari tabel `pelanggan` tiap kali layar dibuka, supaya
-- begitu Admin/Pemilik centang "Sudah Bayar", angkanya langsung berubah
-- tanpa nunggu proses lain. Baris di tabel ini baru muncul setelah
-- bulannya "ditutup".
--
-- Data 10 bulan (Okt-25 s.d. Jul-26) di-backfill dari catatan manual yang
-- sebelumnya ada di Google Sheets "Laporan Keuangan KRISTEK", supaya
-- laporan di app langsung ada histori-nya sejak hari pertama fitur ini
-- dipakai.

create table if not exists public.laporan_bulanan (
  id uuid primary key default gen_random_uuid(),
  periode date not null unique,
  total_user integer not null,
  omset bigint not null,
  sudah_bayar bigint not null,
  belum_bayar bigint not null,
  created_at timestamptz not null default now()
);

alter table public.laporan_bulanan enable row level security;

-- Data finansial -- cuma Pemilik yang boleh lihat, konsisten dengan
-- visibilitas billing/Mikrotik lain yang sengaja unscoped tapi
-- Pemilik-only (ADR-0003).
create policy "only pemilik can read laporan bulanan"
  on public.laporan_bulanan for select
  to authenticated
  using (public.current_user_role() = 'pemilik');

insert into public.laporan_bulanan (periode, total_user, omset, sudah_bayar, belum_bayar)
values
  ('2025-10-01', 70, 13275334, 12570334, 705000),
  ('2025-11-01', 85, 13288400, 12985900, 302500),
  ('2025-12-01', 93, 15006500, 14841500, 165000),
  ('2026-01-01', 103, 16528900, 15998900, 530000),
  ('2026-02-01', 104, 16013500, 15848500, 165000),
  ('2026-03-01', 104, 16409500, 16409500, 0),
  ('2026-04-01', 107, 16386200, 16056200, 330000),
  ('2026-05-01', 115, 18538500, 18373500, 165000),
  ('2026-06-01', 122, 19701900, 19701900, 0),
  ('2026-07-01', 127, 20869900, 19413900, 1456000)
on conflict (periode) do nothing;
