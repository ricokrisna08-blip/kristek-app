-- Fix: Teknisi yang ditugaskan lintas-Wilayah (0008) tidak bisa baca data
-- Pelanggan dari Tiket yang ditugaskan ke mereka, kalau Pelanggan itu ada
-- di Wilayah lain -- muncul sebagai "Pelanggan tidak diketahui" di Tiket
-- Saya. RLS pelanggan (0005) cuma izinkan baca Wilayah sendiri, padahal
-- Teknisi sekarang bisa kerja lintas Wilayah.
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0010.

create policy "teknisi can read pelanggan of assigned tiket"
  on public.pelanggan for select
  to authenticated
  using (
    exists (
      select 1 from public.tiket t
      where t.pelanggan_id = pelanggan.id
    )
  );

-- Sekalian untuk ODP -- Tiket Maintenance rujuk ODP langsung, bisa kena
-- masalah yang sama kalau Teknisi ditugaskan lintas Wilayah.
create policy "teknisi can read odp of assigned tiket"
  on public.odp for select
  to authenticated
  using (
    exists (
      select 1 from public.tiket t
      where t.odp_id = odp.id
    )
  );
