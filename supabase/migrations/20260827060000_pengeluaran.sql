-- Uang Keluar: gaji, bandwidth/ISP, listrik, bagi hasil investor, dll,
-- dicatat per baris supaya Laporan Keuangan bisa nunjukin Sisa Uang
-- (Sudah Bayar bulan itu dikurangi total Pengeluaran bulan itu), bukan
-- cuma sisi pemasukan doang seperti sekarang.
--
-- Satu baris ISI SALAH SATU dari nominal (flat Rupiah) atau persen (%
-- dari Sudah Bayar bulan itu, dihitung otomatis di kode -- lihat
-- getLaporanKeuangan.ts/listPengeluaranBulanIni.ts) -- bukan dua-duanya.
-- Cocok buat baris kayak "PPN + BHP + USO 1.75%"/"Fee ISP 3%" yang
-- besarannya ngikutin pemasukan bulan itu, bukan angka tetap.
create table public.pengeluaran (
  id uuid primary key default gen_random_uuid(),
  kategori text not null,
  keterangan text not null,
  nominal integer,
  persen numeric(5, 2),
  tanggal date not null default current_date,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  constraint pengeluaran_nominal_or_persen_check
    check (
      (nominal is not null and persen is null)
      or (nominal is null and persen is not null)
    )
);

alter table public.pengeluaran enable row level security;

-- Pola sama seperti wa_blast_job/pengajuan_cuti: finansial itu
-- lintas-Wilayah, cuma Pemilik yang pernah lihat Laporan Keuangan sama
-- sekali (canViewLaporanKeuangan), jadi RLS-nya nggak perlu Wilayah-scoping.
create policy "pemilik can read all pengeluaran"
  on public.pengeluaran for select
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "pemilik can insert pengeluaran"
  on public.pengeluaran for insert
  to authenticated
  with check (
    public.current_user_role() = 'pemilik'
    and created_by = auth.uid()
  );

create policy "pemilik can delete pengeluaran"
  on public.pengeluaran for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');
